import { Target } from 'lucide-react'
import { NavLink } from '@/components/nav-link'
import { Button, buttonVariants } from '@/components/ui/button'
import type { DashboardMatch } from '../types'
import { ScoreRing } from './score-ring'

// The one match to act on, set apart in its own panel: big title, the score as a ring, and the
// single primary action on the page. Everything else about the job lives behind those buttons.
export function NextBestMove({
  match,
  onViewInsight
}: {
  match: DashboardMatch
  onViewInsight: (job: DashboardMatch['job']) => void
}) {
  return (
    <section
      aria-labelledby="next-best-move-heading"
      className="rounded-2xl border border-primary/20 bg-accent/50 p-6 sm:p-8"
    >
      {/* Phone order is text, score, actions. From `sm` the score sits on the right across both rows. */}
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:gap-x-10">
        <div className="min-w-0">
          <h2
            id="next-best-move-heading"
            className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
          >
            Next best move
          </h2>
          <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            {match.job.title}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {match.job.company}
            {match.job.sourceName ? ` · ${match.job.sourceName}` : ''}
          </p>
        </div>

        <div className="justify-self-center sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:self-center sm:justify-self-end">
          <ScoreRing score={match.hybridScore} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <NavLink
            href={`/listings/${match.job.id}`}
            pendingLabel="Opening listing…"
            className={buttonVariants({ size: 'lg', className: 'w-full sm:w-auto' })}
          >
            View Match
          </NavLink>
          <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => onViewInsight(match.job)}>
            <Target className="size-4" />
            See Why It Matches
          </Button>
        </div>
      </div>
    </section>
  )
}
