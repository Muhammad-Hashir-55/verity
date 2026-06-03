import { createClient, createServiceClient } from '@/lib/supabase/server'
import { embedText } from '@/lib/gemini'
import { tavilySearch } from '@/lib/tavily'
import { groq, GROQ_MODEL } from '@/lib/groq'

async function verifyClaimWithGroq(
  claim: string,
  searchResults: { answer: string; results: any[] }
) {
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a rigorous fact-checker. You will be given a claim and web search results. Analyze the evidence and return a structured verdict.

Return ONLY valid JSON in this exact format (no markdown):
{
  "verdict": "verified" | "disputed" | "false" | "unverifiable",
  "reasoning": "2-3 sentence explanation of your verdict based on the evidence",
  "confidence": "high" | "medium" | "low"
}

Verdict definitions:
- verified: Multiple reliable sources confirm this claim is true
- disputed: Sources conflict or the claim is partially true
- false: Reliable sources directly contradict this claim
- unverifiable: Insufficient evidence found to confirm or deny`,
        },
        {
          role: 'user',
          content: `Claim: ${claim}

Web Search Answer: ${searchResults.answer || 'No answer available'}

Top Sources:
${(searchResults.results || [])
  .map((r: any, i: number) => `${i + 1}. ${r.title}: ${r.snippet}`)
  .join('\n')}

Return your verdict as JSON.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    })

    const content = completion.choices[0]?.message?.content || ''
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    const parsed = JSON.parse(cleaned)
    return {
      verdict: parsed.verdict || 'unverifiable',
      reasoning: parsed.reasoning || 'Unable to determine.',
      sources: searchResults.results || [],
    }
  } catch {
    return {
      verdict: 'unverifiable',
      reasoning: 'Web search unavailable.',
      sources: [],
    }
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { text } = await request.json()

  if (!text || typeof text !== 'string') {
    return new Response(JSON.stringify({ error: 'Text is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const encoder = new TextEncoder()

  const send = async (payload: any) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
  }

  ;(async () => {
    try {
      // 1. Create fact_check_session
      const serviceClient = await createServiceClient()
      const { data: session, error: sessionError } = await serviceClient
        .from('fact_check_sessions')
        .insert({ user_id: user.id, original_text: text })
        .select('id')
        .single()

      if (sessionError) throw new Error(sessionError.message)

      const sessionId = session.id

      // 2. Extract claims directly via Groq
      let claims: Array<{ claim_text: string; source_sentence: string }> = []
      try {
        const completion = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are a precise fact-extraction engine. Given a piece of text, extract every individual verifiable factual claim.

Rules:
- Each claim must be a single, atomic, independently verifiable statement
- Do not include opinions, predictions, or subjective statements
- Keep the claim self-contained (include enough context so it makes sense alone)
- Also return the source_sentence: the exact sentence from the original text this claim came from
- Return ONLY valid JSON, no markdown, no explanation

Return format:
{
  "claims": [
    { "claim_text": "...", "source_sentence": "..." },
    ...
  ]
}`,
            },
            {
              role: 'user',
              content: `Extract all verifiable claims from this text:\n\n${text}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 4096,
        })

        const content = completion.choices[0]?.message?.content || ''
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)
        claims = parsed.claims || []
      } catch (err) {
        console.error('Claim extraction failed:', err)
        await send({ type: 'error', message: 'Failed to extract claims' })
        return
      }

      if (claims.length === 0) {
        await send({ type: 'error', message: 'No verifiable claims found in the text.' })
        return
      }

      // 3. Process all claims in parallel
      const processClaim = async (
        claim: { claim_text: string; source_sentence: string },
        index: number
      ) => {
        try {
          // a. Embed claim
          let embedding: number[] = []
          try {
            embedding = await embedText(claim.claim_text)
          } catch {
            // If embedding fails, skip KB check and go straight to web search
          }

          // b. Check KB
          if (embedding.length > 0) {
            try {
              const { data: kbData } = await serviceClient.rpc('match_claims', {
                query_embedding: embedding,
                match_threshold: 0.88,
                match_count: 1,
                p_user_id: user.id,
              })

              if (kbData && kbData.length > 0) {
                const cached = kbData[0]
                await send({
                  type: 'claim_result',
                  claim_text: claim.claim_text,
                  verdict: cached.verdict,
                  reasoning: cached.reasoning,
                  sources: cached.sources || [],
                  is_cached: true,
                  similarity_score: cached.similarity,
                  source_sentence: claim.source_sentence,
                  index,
                })
                return
              }
            } catch {
              // KB check failed, proceed to web search
            }
          }

          // c. Cache miss - search web and verify
          let searchResults = { answer: '', results: [] as any[] }
          try {
            searchResults = await tavilySearch(claim.claim_text)
          } catch {
            // Search failed
          }

          const verification = await verifyClaimWithGroq(claim.claim_text, searchResults)

          // d. Store in KB
          try {
            await serviceClient.from('claims').insert({
              session_id: sessionId,
              user_id: user.id,
              claim_text: claim.claim_text,
              source_sentence: claim.source_sentence,
              embedding: embedding.length > 0 ? embedding : null,
              verdict: verification.verdict,
              reasoning: verification.reasoning,
              sources: verification.sources,
              is_cached: false,
            })
          } catch {
            // Storage failed, but we still have the result
          }

          // e. Send result
          await send({
            type: 'claim_result',
            claim_text: claim.claim_text,
            verdict: verification.verdict,
            reasoning: verification.reasoning,
            sources: verification.sources,
            is_cached: false,
            similarity_score: null,
            source_sentence: claim.source_sentence,
            index,
          })
        } catch {
          await send({
            type: 'claim_result',
            claim_text: claim.claim_text,
            verdict: 'unverifiable',
            reasoning: 'An error occurred during verification.',
            sources: [],
            is_cached: false,
            similarity_score: null,
            source_sentence: claim.source_sentence,
            index,
          })
        }
      }

      await Promise.all(claims.map((claim, i) => processClaim(claim, i)))

      // 4. Done
      await send({ type: 'done', session_id: sessionId })
    } catch (err: any) {
      await send({ type: 'error', message: err.message || 'Pipeline failed' })
    } finally {
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}