'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import type { JobMatch } from '@angkop/shared'
import { MatchScoreBadge } from '@/components/match-score-badge'
import { MatchInsightDialog } from '@/components/match-insight-dialog'
import { Button } from '@/components/ui/button'

export function TopMatchCard({ match, rank }: { match: JobMatch; rank: number }) {
  const [insightOpen, setInsightOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border p-4 transition-colors hover:border-foreground/20 hover:shadow-sm">
      <Link href={`/listings/${match.job.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{match.job.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {match.job.company}
            {match.job.sourceName ? ` · ${match.job.sourceName}` : ''}
          </p>
        </div>
        <MatchScoreBadge score={match.hybridScore} />
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>

      <Button variant="ghost" size="icon-sm" aria-label="Why this is a match" onClick={() => setInsightOpen(true)}>
        <Sparkles className="size-4" />
      </Button>

      <MatchInsightDialog
        open={insightOpen}
        onOpenChange={setInsightOpen}
        jobId={match.job.id}
        jobTitle={match.job.title}
        jobCompany={match.job.company}
      />
    </div>
  )
}
