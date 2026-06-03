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

  const { text } = await request.json()

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 })
  }

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

    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)
      return NextResponse.json({ claims: parsed.claims || [] })
    } catch {
      return NextResponse.json({ claims: [] })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to extract claims' },
      { status: 500 }
    )
  }
}