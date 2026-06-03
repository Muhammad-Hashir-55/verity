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
          content: `CRITICAL INSTRUCTIONS — FOLLOW EXACTLY:

You are a fact-checker. You are given a claim and web search results from a live search.

STRICT RULES:
1. You MUST base your verdict ONLY on the web search results provided below.
2. You MUST NOT use any of your own training knowledge, pre-existing knowledge, or assumptions.
3. If the search results do not contain enough information to verify or refute the claim, you MUST return "unverifiable".
4. Your reasoning MUST quote or reference specific search results by name/title.
5. If you find yourself reasoning from knowledge not in the search results, STOP and return "unverifiable".

Return ONLY valid JSON in this exact format (no markdown):
{
  "verdict": "verified" | "disputed" | "false" | "unverifiable",
  "reasoning": "2-3 sentences explaining your verdict, citing specific sources from the search results by name",
  "confidence": "high" | "medium" | "low"
}

Verdict definitions:
- verified: The search results explicitly confirm this claim is true
- disputed: The search results give conflicting information about this claim
- false: The search results explicitly contradict this claim
- unverifiable: The search results do not contain enough information to determine truthfulness`,
        },
        {
          role: 'user',
          content: `CLAIM TO VERIFY: "${claim}"

BELOW ARE THE WEB SEARCH RESULTS YOU MUST USE — DO NOT USE ANY OTHER KNOWLEDGE:

Tavily AI Summary: ${search_results.answer || 'No summary available.'}

Sources found:
${(search_results.results || [])
  .map(
    (r: any, i: number) =>
      `[Source ${i + 1}] "${r.title}"\nURL: ${r.url}\nContent: ${r.snippet}`
  )
  .join('\n\n')}

Based ONLY on the sources above, what is your verdict? Return JSON.`,
        },
      ],
      temperature: 0.0,
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