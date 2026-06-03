'use client'

interface HighlightedTextProps {
  text: string
  claims: Array<{
    claim_text: string
    source_sentence: string
    verdict: string
    [key: string]: any
  }>
  onClaimClick: (claim: any) => void
}

const verdictBgColors: Record<string, string> = {
  verified: 'bg-green-500/20 hover:bg-green-500/30 border-b-2 border-green-500/50',
  disputed: 'bg-yellow-500/20 hover:bg-yellow-500/30 border-b-2 border-yellow-500/50',
  false: 'bg-red-500/20 hover:bg-red-500/30 border-b-2 border-red-500/50',
  unverifiable: 'bg-gray-500/20 hover:bg-gray-500/30 border-b-2 border-gray-500/50',
}

export default function HighlightedText({ text, claims, onClaimClick }: HighlightedTextProps) {
  // Split text into sentences
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0)

  // Build a map from source_sentence to claim
  const sourceMap = new Map<string, any>()
  for (const claim of claims) {
    if (claim.source_sentence) {
      sourceMap.set(claim.source_sentence.trim().toLowerCase(), claim)
    }
  }

  return (
    <div className="text-sm leading-relaxed text-[#d4d4d4] space-y-1">
      {sentences.map((sentence, i) => {
        const trimmed = sentence.trim()
        const match = sourceMap.get(trimmed.toLowerCase())

        if (match) {
          const bgColor = verdictBgColors[match.verdict] || verdictBgColors.unverifiable
          return (
            <span
              key={i}
              className={`inline cursor-pointer transition-colors rounded px-0.5 ${bgColor}`}
              onClick={() => onClaimClick(match)}
              title={`Click to see ${match.verdict} claim details`}
            >
              {trimmed}{' '}
            </span>
          )
        }

        return (
          <span key={i} className="inline">
            {trimmed}{' '}
          </span>
        )
      })}
    </div>
  )
}