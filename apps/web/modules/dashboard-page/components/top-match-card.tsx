import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { JobMatch } from '@angkop/shared'
import { MatchScoreBadge } from '@/components/match-score-badge'

export function TopMatchCard({ match, rank }: { match: JobMatch; rank: number }) {
  return (
    <Link
      href={`/listings/${match.job.id}`}
      className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:border-foreground/20 hover:shadow-sm"
    >
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
  )
}
