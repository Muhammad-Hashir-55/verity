import { NextResponse } from 'next/server'
import { tavilySearch } from '@/lib/tavily'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { claim } = await request.json()

  if (!claim || typeof claim !== 'string') {
    return NextResponse.json({ error: 'Claim is required' }, { status: 400 })
  }

  try {
    const result = await tavilySearch(claim)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { answer: '', results: [], error: error.message || 'Web search unavailable' },
      { status: 500 }
    )
  }
}