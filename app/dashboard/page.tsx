import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import FactCheckInput from '@/components/FactCheckInput'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar user={user} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2">
            Fact Check
          </h1>
          <p className="text-sm text-[#737373]">
            Paste any text and Verity will break it into claims and verify each one.
          </p>
        </div>
        <FactCheckInput />
      </main>
    </div>
  )
}