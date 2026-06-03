import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { embedding, user_id } = await request.json()

  if (!embedding || !user_id) {
    return NextResponse.json(
      { error: 'Embedding and user_id are required' },
      { status: 400 }
    )
  }

  try {
    const serviceClient = await createServiceClient()
    const { data } = await serviceClient.rpc('match_claims', {
      query_embedding: embedding,
      match_threshold: 0.88,
      match_count: 1,
      p_user_id: user_id,
    })

    if (data && data.length > 0) {
      return NextResponse.json({ hit: true, cached_claim: data[0] })
    }

    return NextResponse.json({ hit: false })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to check knowledge base' },
      { status: 500 }
    )
  }
}