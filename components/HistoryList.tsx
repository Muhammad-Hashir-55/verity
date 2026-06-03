'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import HistoryCard from '@/components/HistoryCard'
import ClaimCard from '@/components/ClaimCard'
import ClaimSidebar from '@/components/ClaimSidebar'
import HighlightedText from '@/components/HighlightedText'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface Session {
  id: string
  original_text: string
  overall_summary: string | null
  created_at: string
  claim_count: number
}

interface Claim {
  claim_text: string
  verdict: string
  reasoning: string
  sources: any[]
  is_cached: boolean
  source_sentence: string
}

export default function HistoryList({ sessions }: { sessions: Session[] }) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [loadingClaims, setLoadingClaims] = useState(false)
  const [sidebarClaim, setSidebarClaim] = useState<Claim | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const supabase = createClient()

  const handleSessionClick = async (session: Session) => {
    setLoadingClaims(true)
    setSelectedSession(session)

    const { data } = await supabase
      .from('claims')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })

    setClaims(data || [])
    setLoadingClaims(false)
  }

  const handleClaimClick = (claim: Claim) => {
    setSidebarClaim(claim)
    setSidebarOpen(true)
  }

  if (selectedSession) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="text-[#737373] hover:text-[#f5f5f5] hover:bg-[#1a1a1a]"
          onClick={() => {
            setSelectedSession(null)
            setClaims([])
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to History
        </Button>

        <div>
          <h2 className="text-lg font-semibold text-[#f5f5f5] mb-2">
            Original Text
          </h2>
          <Card className="bg-[#111111] border-[#1f1f1f] p-6 rounded-xl">
            <HighlightedText
              text={selectedSession.original_text}
              claims={claims}
              onClaimClick={handleClaimClick}
            />
          </Card>
        </div>

        {selectedSession.overall_summary && (
          <Card className="bg-[#111111] border-[#1f1f1f] p-6 rounded-xl">
            <h3 className="text-sm font-medium text-[#737373] uppercase tracking-wider mb-3">
              Overall Summary
            </h3>
            <p className="text-sm text-[#d4d4d4] leading-relaxed">
              {selectedSession.overall_summary}
            </p>
          </Card>
        )}

        {loadingClaims ? (
          <Card className="bg-[#111111] border-[#1f1f1f] p-6 text-center rounded-xl">
            <p className="text-sm text-[#737373]">Loading claims...</p>
          </Card>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[#737373] uppercase tracking-wider">
              Claims ({claims.length})
            </h3>
            {claims.map((claim, i) => (
              <ClaimCard
                key={i}
                claim={claim}
                onClick={() => handleClaimClick(claim)}
              />
            ))}
          </div>
        )}

        <ClaimSidebar
          claim={sidebarClaim}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card className="bg-[#111111] border-[#1f1f1f] p-12 text-center rounded-xl">
        <p className="text-[#737373]">No fact-checking sessions yet.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <HistoryCard
          key={session.id}
          session={session}
          onClick={() => handleSessionClick(session)}
        />
      ))}
    </div>
  )
}