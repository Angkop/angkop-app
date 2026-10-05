'use client'

import { useMutation, useQuery } from '@apollo/client/react'
import { PageHeader } from '@/components/page-header'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
import { MatchStatsRow } from './components/match-stats-row'
import { TopMatchesList } from './components/top-matches-list'
import { JOB_MATCHES_QUERY, LOG_INTERACTION_MUTATION, SAVE_JOB_MUTATION } from './queries'
import type { JobMatchesQueryResult } from './types'

export function DashboardPage() {
  const { data, loading, error, refetch } = useQuery<JobMatchesQueryResult>(JOB_MATCHES_QUERY)
  const [logInteraction] = useMutation(LOG_INTERACTION_MUTATION)
  const [saveJob] = useMutation(SAVE_JOB_MUTATION)

  async function handleSave(jobId: string) {
    await saveJob({ variables: { jobId } })
    await refetch()
  }

  async function handleDismiss(jobId: string) {
    await logInteraction({ variables: { jobId, eventType: 'dismiss' } })
    await refetch()
  }

  if (loading) {
    return <LoadingSkeleton rows={3} heightClassName="h-16" />
  }

  if (error) {
    return <ErrorMessage>Could not load job matches: {error.message}</ErrorMessage>
  }

  const matches = data?.jobMatches ?? []

  return (
    <div>
      <PageHeader title="Your matches" description="Jobs ranked by how well they fit your profile." />
      <MatchStatsRow matches={matches} />
      <TopMatchesList matches={matches} onSave={handleSave} onDismiss={handleDismiss} />
    </div>
  )
}
