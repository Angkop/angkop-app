'use client'

import { useMutation, useQuery } from '@apollo/client/react'
import { PageHeader } from '@/components/page-header'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
import {
  JOB_MATCHES_QUERY,
  LOG_INTERACTION_MUTATION,
  SAVE_JOB_MUTATION
} from '@/modules/dashboard-page/queries'
import type { JobMatchesQueryResult } from '@/modules/dashboard-page/types'
import { MatchesBrowser } from './components/matches-browser'

export function AllMatchesPage() {
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
    return <LoadingSkeleton rows={6} heightClassName="h-16" />
  }

  if (error) {
    return <ErrorMessage>Could not load job matches: {error.message}</ErrorMessage>
  }

  const matches = data?.jobMatches ?? []

  return (
    <div>
      <PageHeader title="All Matches" description="Every ingested job ranked by fit with your profile." />
      <MatchesBrowser matches={matches} onSave={handleSave} onDismiss={handleDismiss} />
    </div>
  )
}
