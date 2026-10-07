import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { JobMatch } from '@angkop/shared'
import { JobRow } from '@/components/job-row'

export function TopMatchesList({
  matches,
  totalCount,
  onSave,
  onDismiss
}: {
  matches: JobMatch[]
  totalCount: number
  onSave: (jobId: string) => void
  onDismiss: (jobId: string) => void
}) {
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
          No job matches yet. Run the seed script to load sample postings, then refresh.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {matches.map((match) => (
            <JobRow key={match.job.id} job={match.job} score={match.hybridScore} onSave={onSave} onDismiss={onDismiss} />
          ))}
        </div>
      )}
    </section>
  )
}
