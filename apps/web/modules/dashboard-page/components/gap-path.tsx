'use client'

import { ArrowRight, GraduationCap } from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorMessage } from '@/components/error-message'
import { NavLink } from '@/components/nav-link'
import { GAP_PATH_COUNT } from '@/constants/dashboard'
import { DASHBOARD_GAPS_QUERY } from '../queries'
import type { DashboardGapsQueryResult } from '../types'
import { GapPathSkeleton } from './dashboard-skeleton'

// The top skill gaps from the seeker's saved jobs as a route: each stop is a skill to add
// and the first course that teaches it. skillGaps can take a while on a cold cache (it calls
// the ML service), so this region loads on its own and never holds up the matches above it.
export function GapPath() {
  const { data, loading, error, refetch } = useQuery<DashboardGapsQueryResult>(DASHBOARD_GAPS_QUERY, {
    variables: { pageSize: GAP_PATH_COUNT }
  })

  if (loading && !data) return <GapPathSkeleton />
  if (error && !data) {
    return (
      <ErrorMessage onRetry={refetch} retryLabel="Reload Skill Gaps">
        Could not load your skill gaps: {error.message}
      </ErrorMessage>
    )
  }

  const gaps = data?.skillGaps.items ?? []
  const totalGaps = data?.skillGaps.total ?? 0
  const savedJobCount = data?.savedJobCount ?? 0

  return (
    <section aria-labelledby="gap-path-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="gap-path-heading" className="text-sm font-semibold text-foreground">
          Your Skill Path
        </h2>
        {totalGaps > gaps.length ? (
          <NavLink
            href="/skill-gaps"
            pendingLabel="Loading skill gaps…"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all {totalGaps} skills
            <ArrowRight className="size-3.5" />
          </NavLink>
        ) : null}
      </div>

      {gaps.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={savedJobCount === 0 ? 'No saved jobs to compare yet' : 'No skills to add right now'}
          description={
            savedJobCount === 0
              ? 'Save a job and Angkop compares its required skills with yours, then suggests courses for the ones to add.'
              : 'Your profile covers the skills on the jobs you saved. Save more jobs to see where else to grow.'
          }
        />
      ) : (
        <ol className="ml-2 border-l border-border">
          {gaps.map((gap) => {
            const course = gap.courses[0]
            return (
              <li key={gap.skill} className="relative pb-6 pl-6 last:pb-0">
                <span className="absolute top-1 -left-[5px] size-2.5 rounded-full border-2 border-background bg-primary" />
                <p className="font-display text-sm font-medium text-foreground">Add {gap.skill}</p>
                {course ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="text-foreground">{course.title}</span> · {course.provider}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">No course suggestion yet.</p>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
