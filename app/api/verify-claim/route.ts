import { NextResponse } from 'next/server'
import { groq, GROQ_MODEL } from '@/lib/groq'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { claim, search_results } = await request.json()

  if (!claim || !search_results) {
    return NextResponse.json(
      { error: 'Claim and search_results are required' },
      { status: 400 }
    )
  }

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

Web Search Answer: ${search_results.answer || 'No answer available'}

Top Sources:
${(search_results.results || [])
  .map(
    (r: any, i: number) => `${i + 1}. ${r.title}: ${r.snippet}`
  )
  .join('\n')}

Return your verdict as JSON.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    })

    const content = completion.choices[0]?.message?.content || ''

    try {
      const cleaned = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      const parsed = JSON.parse(cleaned)
      return NextResponse.json({
        verdict: parsed.verdict || 'unverifiable',
        reasoning: parsed.reasoning || 'Unable to determine.',
        confidence: parsed.confidence || 'low',
      })
    } catch {
      return NextResponse.json({
        verdict: 'unverifiable',
        reasoning: 'Failed to parse verification result.',
        confidence: 'low',
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        verdict: 'unverifiable',
        reasoning: 'Web search unavailable.',
        confidence: 'low',
      },
      { status: 200 }
    )
  }
}