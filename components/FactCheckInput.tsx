'use client'

import { useState, useRef, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import HighlightedText from '@/components/HighlightedText'
import ClaimCard from '@/components/ClaimCard'
import ClaimSidebar from '@/components/ClaimSidebar'
import { Loader2, Search, Sparkles, Database } from 'lucide-react'

const DEMO_INPUTS = [
  {
    label: 'Mixed Truth/False',
    text: 'The Great Wall of China is visible from space with the naked eye. Albert Einstein failed mathematics as a child. The human body has 206 bones. Mount Everest is the tallest mountain on Earth. Goldfish have a memory span of only three seconds.',
  },
  {
    label: 'Tech Claims',
    text: 'Python was created by Guido van Rossum in 1991. Apple was founded in a garage in 1976. The first iPhone was released in 2008. Facebook was originally called TheFacebook and launched at Harvard. Google\'s headquarters is located in Seattle, Washington.',
  },
  {
    label: 'Recent-ish',
    text: 'OpenAI was founded in 2015 as a non-profit. GPT stands for Generative Pre-trained Transformer. The first large language model was created by Google. ChatGPT reached one million users in five days after launch.',
  },
]

interface ClaimResult {
  claim_text: string
  verdict: string
  reasoning: string
  sources: any[]
  is_cached: boolean
  similarity_score: number | null
  source_sentence: string
  confidence?: string
}

export default function FactCheckInput() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [claims, setClaims] = useState<ClaimResult[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [summary, setSummary] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [sidebarClaim, setSidebarClaim] = useState<ClaimResult | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [error, setError] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const claimsAccumulatorRef = useRef<ClaimResult[]>([])

  // Compute KB stats from claims
  const cacheHits = claims.filter((c) => c.is_cached).length
  const liveSearches = claims.filter((c) => !c.is_cached).length
  const avgSimilarity =
    cacheHits > 0
      ? claims
          .filter((c) => c.is_cached && c.similarity_score != null)
          .reduce((sum, c) => sum + (c.similarity_score || 0), 0) / cacheHits
      : 0

  const handleSubmit = async () => {
    if (!text.trim() || loading) return

    setLoading(true)
    setClaims([])
    setSessionId(null)
    setSummary('')
    setError('')
    setProgress({ current: 0, total: 0 })
    claimsAccumulatorRef.current = []

    try {
      const response = await fetch('/api/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          try {
            const payload = JSON.parse(jsonStr)

            if (payload.type === 'claim_result') {
              claimsAccumulatorRef.current.push(payload)
              setClaims([...claimsAccumulatorRef.current])
              setProgress((prev) => ({
                current: prev.current + 1,
                total: prev.total,
              }))
            }

            if (payload.type === 'done') {
              const completedSessionId = payload.session_id
              setSessionId(completedSessionId)
              // Fetch summary with accumulated claims
              try {
                const summaryRes = await fetch('/api/summary', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    claims: claimsAccumulatorRef.current.map((c) => ({
                      claim_text: c.claim_text,
                      verdict: c.verdict,
                    })),
                    session_id: completedSessionId,
                  }),
                })
                const summaryData = await summaryRes.json()
                setSummary(summaryData.summary || '')
              } catch {
                // Summary fetch failed
              }
            }

            if (payload.type === 'error') {
              setError(payload.message)
            }
          } catch {
            // Parse error, skip
          }
        }
      }

      // Estimate total from claims received
      setProgress((prev) => ({ ...prev, current: prev.current }))
    } catch (err: any) {
      setError(err.message || 'Failed to fact-check. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClaimClick = (claim: ClaimResult) => {
    setSidebarClaim(claim)
    setSidebarOpen(true)
  }

  const handleDemoInput = (demoText: string) => {
    setText(demoText)
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4">
        <Textarea
          placeholder="Paste any text to fact-check... (article, speech, tweet, paragraph)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[160px] bg-[#111111] border-[#1f1f1f] text-[#f5f5f5] placeholder:text-[#555] resize-none text-sm leading-relaxed rounded-xl"
          disabled={loading}
        />

        {/* Demo Inputs */}
        <div className="flex flex-wrap gap-2">
          {DEMO_INPUTS.map((demo) => (
            <Button
              key={demo.label}
              variant="outline"
              size="sm"
              className="text-xs border-[#2a2a2a] bg-[#111111] text-[#737373] hover:bg-[#1a1a1a] hover:text-[#f5f5f5]"
              onClick={() => handleDemoInput(demo.text)}
              disabled={loading}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {demo.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-[#555]">
            {text.length > 0 && `${text.length} characters`}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || loading}
            className="bg-[#6366f1] hover:bg-[#5558e6] text-white px-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Fact Check
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Indicator */}
      {loading && claims.length === 0 && (
        <Card className="bg-[#111111] border-[#1f1f1f] p-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#6366f1]" />
            <span className="text-sm text-[#737373]">
              Extracting claims from text...
            </span>
          </div>
        </Card>
      )}

      {loading && claims.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-[#737373]">
          <Loader2 className="w-4 h-4 animate-spin text-[#6366f1]" />
          <span>Processing claims ({claims.length} found)...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="bg-red-900/20 border-red-800/50 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      {/* Knowledge Base Stats */}
      {claims.length > 0 && !loading && (
        <Card className="bg-[#111111] border-[#1f1f1f] p-5 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-[#6366f1]" />
            <h3 className="text-sm font-medium text-[#737373] uppercase tracking-wider">
              Knowledge Base
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-[#1a1a1a]">
              <p className="text-2xl font-bold text-[#f5f5f5]">{cacheHits}</p>
              <p className="text-xs text-[#737373] mt-1">⚡ Cache Hits</p>
              {cacheHits > 0 && (
                <p className="text-xs text-[#6366f1] mt-0.5">
                  {(avgSimilarity * 100).toFixed(1)}% avg match
                </p>
              )}
            </div>
            <div className="text-center p-3 rounded-lg bg-[#1a1a1a]">
              <p className="text-2xl font-bold text-[#f5f5f5]">{liveSearches}</p>
              <p className="text-xs text-[#737373] mt-1">🔍 Live Searches</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-[#1a1a1a]">
              <p className="text-2xl font-bold text-[#f5f5f5]">{claims.length}</p>
              <p className="text-xs text-[#737373] mt-1">📊 Total Claims</p>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {claims.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Highlighted Text (60%) */}
          <div className="lg:col-span-3">
            <Card className="bg-[#111111] border-[#1f1f1f] p-6 rounded-xl">
              <h3 className="text-sm font-medium text-[#737373] uppercase tracking-wider mb-4">
                Original Text
              </h3>
              <HighlightedText
                text={text}
                claims={claims}
                onClaimClick={handleClaimClick}
              />
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[#1f1f1f]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
                  <span className="text-xs text-[#737373]">Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/50" />
                  <span className="text-xs text-[#737373]">Disputed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/50" />
                  <span className="text-xs text-[#737373]">False</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gray-500/30 border border-gray-500/50" />
                  <span className="text-xs text-[#737373]">Unverifiable</span>
                </div>
              </div>
            </Card>

            {/* Summary */}
            {summary && (
              <Card className="bg-[#111111] border-[#1f1f1f] p-6 rounded-xl mt-4">
                <h3 className="text-sm font-medium text-[#737373] uppercase tracking-wider mb-3">
                  Overall Summary
                </h3>
                <p className="text-sm text-[#d4d4d4] leading-relaxed">{summary}</p>
              </Card>
            )}
          </div>

          {/* Right: Claims List (40%) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-medium text-[#737373] uppercase tracking-wider">
              Claims ({claims.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {[...claims]
                .sort((a, b) => {
                  const order = { false: 0, disputed: 1, unverifiable: 2, verified: 3 }
                  return (order[a.verdict as keyof typeof order] ?? 4) - (order[b.verdict as keyof typeof order] ?? 4)
                })
                .map((claim, i) => (
                  <ClaimCard
                    key={i}
                    claim={claim}
                    onClick={() => handleClaimClick(claim)}
                  />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <ClaimSidebar
        claim={sidebarClaim}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  )
}