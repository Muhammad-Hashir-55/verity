'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'

interface HistoryCardProps {
  session: {
    id: string
    original_text: string
    overall_summary: string | null
    created_at: string
    claim_count?: number
  }
  onClick: () => void
}

export default function HistoryCard({ session, onClick }: HistoryCardProps) {
  const date = new Date(session.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Card
      className="bg-[#111111] border-[#1f1f1f] p-5 cursor-pointer hover:bg-[#161616] transition-colors rounded-xl"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm text-[#f5f5f5] line-clamp-2 flex-1">
          {session.original_text.slice(0, 120)}
          {session.original_text.length > 120 && '...'}
        </p>
        {session.claim_count != null && (
          <Badge variant="outline" className="text-xs bg-[#1a1a1a] border-[#2a2a2a] text-[#737373] shrink-0">
            {session.claim_count} claims
          </Badge>
        )}
      </div>
      {session.overall_summary && (
        <p className="text-xs text-[#737373] line-clamp-2 mb-3">
          {session.overall_summary}
        </p>
      )}
      <div className="flex items-center gap-1.5 text-[#555]">
        <Clock className="w-3 h-3" />
        <span className="text-xs">{date}</span>
      </div>
    </Card>
  )
}