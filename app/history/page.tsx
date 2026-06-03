import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import HistoryList from '@/components/HistoryList'

export default async function HistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const serviceClient = await createServiceClient()

  const { data: sessions } = await serviceClient
    .from('fact_check_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Get claim counts for each session
  const sessionsWithCounts = await Promise.all(
    (sessions || []).map(async (session) => {
      const { count } = await serviceClient
        .from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session.id)
        .eq('user_id', user.id)

      return { ...session, claim_count: count || 0 }
    })
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar user={user} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">
            History
          </h1>
          <p className="text-sm text-[#737373]">
            Your past fact-checking sessions.
          </p>
        </div>
        <HistoryList sessions={sessionsWithCounts} />
      </main>
    </div>
  )
}