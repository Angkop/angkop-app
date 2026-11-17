'use client'

import Link from 'next/link'
import { ChevronRight, Target } from 'lucide-react'
import type { JobMatchSummary } from '@/lib/job-matches'
import { MatchScoreBadge } from '@/components/match-score-badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function TopMatchCard({
  match,
  rank,
  onViewInsight
}: {
  match: JobMatchSummary
  rank: number
  onViewInsight: (job: JobMatchSummary['job']) => void
}) {
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

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Why this is a match" onClick={() => onViewInsight(match.job)}>
            <Target className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Why this is a match</TooltipContent>
      </Tooltip>
    </div>
  )
}
