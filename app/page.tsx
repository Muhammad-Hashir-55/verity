import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, Brain, Database } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#6366f1] flex items-center justify-center mb-8">
            <span className="text-white font-bold text-2xl">V</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-[#f5f5f5] mb-6 leading-tight">
            Truth, sentence
            <br />
            by sentence.
          </h1>
          <p className="text-lg text-[#737373] max-w-xl mb-10 leading-relaxed">
            Paste any text. Verity breaks it into claims and verifies each one
            against the live web.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/signup">
              <Button className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-8 py-6 text-base">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                className="border-[#2a2a2a] bg-[#111111] text-[#f5f5f5] hover:bg-[#1a1a1a] px-8 py-6 text-base"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
          <Card className="bg-[#111111] border-[#1f1f1f] p-6 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-[#6366f1]/20 flex items-center justify-center mb-4">
              <Search className="w-5 h-5 text-[#6366f1]" />
            </div>
            <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">
              Claim Extraction
            </h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              AI-powered analysis breaks your text into individual, atomic
              claims — each one independently verifiable.
            </p>
          </Card>

          <Card className="bg-[#111111] border-[#1f1f1f] p-6 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-[#22c55e]/20 flex items-center justify-center mb-4">
              <Brain className="w-5 h-5 text-[#22c55e]" />
            </div>
            <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">
              Web Verification
            </h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              Each claim is searched against the live web and analyzed with AI
              reasoning to produce a clear verdict.
            </p>
          </Card>

          <Card className="bg-[#111111] border-[#1f1f1f] p-6 rounded-xl">
            <div className="w-10 h-10 rounded-lg bg-[#eab308]/20 flex items-center justify-center mb-4">
              <Database className="w-5 h-5 text-[#eab308]" />
            </div>
            <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">
              Knowledge Base
            </h3>
            <p className="text-sm text-[#737373] leading-relaxed">
              Verified claims are cached with vector embeddings, so future
              similar claims resolve instantly.
            </p>
          </Card>
        </div>
      </main>
    </div>
  )
}