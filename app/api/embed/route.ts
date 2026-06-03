import { NextResponse } from 'next/server'
import { embedText } from '@/lib/gemini'
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
    const embedding = await embedText(text)
    return NextResponse.json({ embedding })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to embed text' },
      { status: 500 }
    )
  }
}