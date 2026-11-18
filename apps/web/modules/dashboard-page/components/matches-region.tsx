'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SearchX } from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorMessage } from '@/components/error-message'
import { buttonVariants } from '@/components/ui/button'
import { DASHBOARD_MATCHES_COUNT } from '@/constants/dashboard'
import { DASHBOARD_MATCHES_QUERY } from '../queries'
import type { DashboardMatch, DashboardMatchesQueryResult } from '../types'
import { MatchesSkeleton } from './dashboard-skeleton'
import { MatchLanes } from './match-lanes'
import { NextBestMove } from './next-best-move'

// Only needed once the user opens a match's explanation, not on every dashboard load.
const MatchInsightDialog = dynamic(
  () => import('@/components/match-insight-dialog').then((mod) => mod.MatchInsightDialog),
  { ssr: false }
)

const NO_MATCHES: DashboardMatch[] = []

// Owns the one jobMatches query that feeds the hero and both lanes, so neither waits on the other
// and they always agree on what the best match is.
export function MatchesRegion() {
  const { data, loading, error, refetch } = useQuery<DashboardMatchesQueryResult>(DASHBOARD_MATCHES_QUERY, {
    variables: { pageSize: DASHBOARD_MATCHES_COUNT }
  })
  const [insightTarget, setInsightTarget] = useState<DashboardMatch['job'] | null>(null)

  if (loading && !data) return <MatchesSkeleton />
  if (error && !data) {
    return (
      <ErrorMessage onRetry={refetch} retryLabel="Reload Matches">
        Could not load job matches: {error.message}
      </ErrorMessage>
    )
  }

  const matches = data?.jobMatches.items ?? NO_MATCHES
  const totalCount = data?.jobMatches.total ?? 0
  const strongMatchCount = data?.jobMatches.strongMatchCount ?? 0

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="No job matches yet"
        description="New postings are added regularly. Browse the listings now, or add skills to your profile so more jobs can be matched."
        action={
          <Link href="/listings" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Browse Listings
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-12">
      <NextBestMove match={matches[0]} onViewInsight={setInsightTarget} />

      {/* The hero already shows the best match, so the lanes start after it. */}
      <MatchLanes
        matches={matches.slice(1)}
        totalCount={totalCount}
        strongMatchCount={strongMatchCount}
        onViewInsight={setInsightTarget}
      />

      {insightTarget ? (
        <MatchInsightDialog
          open
          onOpenChange={(open) => {
            if (!open) setInsightTarget(null)
          }}
          jobId={insightTarget.id}
          jobTitle={insightTarget.title}
          jobCompany={insightTarget.company}
        />
      ) : null}
    </div>
  )
}
