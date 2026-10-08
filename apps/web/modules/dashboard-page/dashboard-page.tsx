'use client'

import { useQuery } from '@apollo/client/react'
import { PageHeader } from '@/components/page-header'
import { ErrorMessage } from '@/components/error-message'
import { TOP_MATCHES_COUNT } from '@/constants/dashboard'
import { DashboardSkeleton } from './components/dashboard-skeleton'
import { MatchStatsRow } from './components/match-stats-row'
import { TopMatchesList } from './components/top-matches-list'
import { JOB_MATCHES_QUERY } from './queries'
import type { JobMatchesQueryResult } from './types'

export function DashboardPage() {
  const { data, loading, error } = useQuery<JobMatchesQueryResult>(JOB_MATCHES_QUERY, {
    variables: { page: 1, pageSize: TOP_MATCHES_COUNT }
  })

  const topMatches = data?.jobMatches.items ?? []
  const totalCount = data?.jobMatches.total ?? 0
  const strongMatchCount = data?.jobMatches.strongMatchCount ?? 0

  return (
    <div>
      <PageHeader title="Your matches" description="Jobs ranked by how well they fit your profile." />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorMessage>Could not load job matches: {error.message}</ErrorMessage>
      ) : (
        <>
          <MatchStatsRow totalCount={totalCount} strongMatchCount={strongMatchCount} />
          <TopMatchesList matches={topMatches} totalCount={totalCount} />
        </>
      )}
    </div>
  )
}
