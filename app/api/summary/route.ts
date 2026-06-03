import { NextResponse } from 'next/server'
import { openrouterChat } from '@/lib/openrouter'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { claims, session_id } = await request.json()

  if (!claims || !Array.isArray(claims) || !session_id) {
    return NextResponse.json(
      { error: 'Claims array and session_id are required' },
      { status: 400 }
    )
  }

  try {
    const claimsText = claims
      .map((c: any) => `claim: ${c.claim_text} → verdict: ${c.verdict}`)
      .join('\n')

    const res = await openrouterChat([
      {
        role: 'system',
        content:
          'You are an editorial fact-check analyst. Given the results of a multi-claim fact check, write a concise 3-sentence overall summary. Be direct about the overall reliability of the source text. Format: plain prose, no bullet points.',
      },
      {
        role: 'user',
        content: claimsText,
      },
    ])

    const data = await res.json()
    const summary =
      data.choices?.[0]?.message?.content || 'Unable to generate summary.'

    // Store summary in session
    try {
      const serviceClient = await createServiceClient()
      await serviceClient
        .from('fact_check_sessions')
        .update({ overall_summary: summary })
        .eq('id', session_id)
    } catch {
      // Storage failed, but we still have the summary
    }

    return NextResponse.json({ summary })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    )
  }
}