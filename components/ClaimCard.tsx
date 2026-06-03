'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ClaimCardProps {
  claim: {
    claim_text: string
    verdict: string
    reasoning: string
    sources: any[]
    is_cached?: boolean
    similarity_score?: number | null
    confidence?: string
  }
  onClick?: () => void
}

const verdictColors: Record<string, string> = {
  verified: 'bg-green-900/50 text-green-300 border-green-800',
  disputed: 'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  false: 'bg-red-900/50 text-red-300 border-red-800',
  unverifiable: 'bg-gray-800/50 text-gray-400 border-gray-700',
}

const verdictLabels: Record<string, string> = {
  verified: 'Verified',
  disputed: 'Disputed',
  false: 'False',
  unverifiable: 'Unverifiable',
}

const confidenceDot: Record<string, string> = {
  high: 'bg-green-400',
  medium: 'bg-yellow-400',
  low: 'bg-gray-400',
}

export default function ClaimCard({ claim, onClick }: ClaimCardProps) {
  return (
    <Card
      className="bg-[#111111] border-[#1f1f1f] p-4 cursor-pointer hover:bg-[#161616] transition-colors rounded-xl"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <Badge
          variant="outline"
          className={`text-xs shrink-0 ${verdictColors[claim.verdict] || verdictColors.unverifiable}`}
        >
          {verdictLabels[claim.verdict] || claim.verdict}
        </Badge>
        <div className="flex items-center gap-2">
          {claim.is_cached && (
            <Badge variant="outline" className="text-xs bg-gray-800/50 text-gray-400 border-gray-700">
              ⚡ Cache
            </Badge>
          )}
          {claim.confidence && (
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${confidenceDot[claim.confidence] || 'bg-gray-400'}`}
              />
              <span className="text-xs text-[#737373]">{claim.confidence}</span>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-[#f5f5f5] line-clamp-2 leading-relaxed">
        {claim.claim_text}
      </p>
    </Card>
  )
}