import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { JobMatch } from '@angkop/shared'
import { TopMatchCard } from './top-match-card'

export function TopMatchesList({ matches, totalCount }: { matches: JobMatch[]; totalCount: number }) {
  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Top Matches</h2>
        {totalCount > matches.length ? (
          <Link
            href="/matches"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all {totalCount} matches
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No job matches yet. Run{' '}
          <code className="rounded bg-muted px-1 py-0.5">pnpm --filter @angkop/server run ingest:jobs</code> to pull
          in real listings, then refresh.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {matches.map((match, index) => (
            <TopMatchCard key={match.job.id} match={match} rank={index + 1} />
          ))}
        </div>
      )}
    </section>
  )
}
