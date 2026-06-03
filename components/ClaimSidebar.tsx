'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Badge as BadgeIcon } from 'lucide-react'

interface ClaimSidebarProps {
  claim: {
    claim_text: string
    verdict: string
    reasoning: string
    sources: any[]
    is_cached?: boolean
    similarity_score?: number | null
  } | null
  open: boolean
  onClose: () => void
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

export default function ClaimSidebar({ claim, open, onClose }: ClaimSidebarProps) {
  if (!claim) return null

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="bg-[#111111] border-[#1f1f1f] text-[#f5f5f5] overflow-y-auto max-w-md">
        <SheetHeader className="space-y-4 pb-4 border-b border-[#1f1f1f]">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={`text-sm px-3 py-1 ${verdictColors[claim.verdict] || verdictColors.unverifiable}`}
            >
              {verdictLabels[claim.verdict] || claim.verdict}
            </Badge>
          </div>
          <SheetTitle className="text-lg font-semibold text-[#f5f5f5] leading-relaxed">
            {claim.claim_text}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Source badge */}
          <div className="flex items-center gap-2 text-sm">
            <BadgeIcon className="w-4 h-4 text-[#737373]" />
            {claim.is_cached ? (
              <span className="text-[#737373]">
                ⚡ Retrieved from knowledge base
                {claim.similarity_score != null && (
                  <span className="ml-1 text-[#6366f1]">
                    ({(claim.similarity_score * 100).toFixed(1)}% match)
                  </span>
                )}
              </span>
            ) : (
              <span className="text-[#737373]">🔍 Verified via live web search</span>
            )}
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[#737373] uppercase tracking-wider">
              Reasoning
            </h3>
            <p className="text-sm text-[#f5f5f5] leading-relaxed">{claim.reasoning}</p>
          </div>

          {/* Sources */}
          {claim.sources && claim.sources.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-[#737373] uppercase tracking-wider">
                Sources
              </h3>
              <div className="space-y-2">
                {claim.sources.map((source: any, i: number) => (
                  <a
                    key={i}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#6366f1]/50 transition-colors"
                  >
                    <p className="text-sm font-medium text-[#f5f5f5] line-clamp-1">
                      {source.title}
                    </p>
                    {source.snippet && (
                      <p className="text-xs text-[#737373] mt-1 line-clamp-2">
                        {source.snippet}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}