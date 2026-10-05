import type { JobMatch } from '@angkop/shared'
import { JobRow } from '@/components/job-row'

export function TopMatchesList({
  matches,
  onSave,
  onDismiss
}: {
  matches: JobMatch[]
  onSave: (jobId: string) => void
  onDismiss: (jobId: string) => void
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Top Matches</h2>
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
