'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { MatchesBrowser } from './components/matches-browser'
import { PAGE_SIZE } from './constants'
import { useMatchFilters } from './hooks/use-match-filters'
import { JOB_MATCHES_QUERY, LOG_INTERACTION_MUTATION, SAVE_JOB_MUTATION, getListingSkills } from './queries'
import type { JobMatchesQueryResult } from './types'

export function AllMatchesPage() {
  const filters = useMatchFilters()
  const [skills, setSkills] = useState<string[]>([])

  useEffect(() => {
    getListingSkills().then(setSkills)
  }, [])

  const { data, loading, error, refetch } = useQuery<JobMatchesQueryResult>(JOB_MATCHES_QUERY, {
    variables: {
      page: filters.page,
      pageSize: PAGE_SIZE,
      search: filters.appliedQuery || undefined,
      skill: filters.appliedSkill === ALL_FILTER_VALUE ? undefined : filters.appliedSkill
    },
    notifyOnNetworkStatusChange: true
  })
  const [logInteraction] = useMutation(LOG_INTERACTION_MUTATION)
  const [saveJob] = useMutation(SAVE_JOB_MUTATION)

  async function handleSave(jobId: string) {
    try {
      await saveJob({ variables: { jobId } })
      await refetch()
      toast.success('Saved to your applications')
    } catch (saveError) {
      toast.error('Could not save this job', {
        description: saveError instanceof Error ? saveError.message : undefined
      })
    }
  }

  async function handleDismiss(jobId: string) {
    try {
      await logInteraction({ variables: { jobId, eventType: 'dismiss' } })
      await refetch()
      toast.success('Job dismissed')
    } catch (dismissError) {
      toast.error('Could not dismiss this job', {
        description: dismissError instanceof Error ? dismissError.message : undefined
      })
    }
  }

  if (error) {
    return <ErrorMessage>Could not load job matches: {error.message}</ErrorMessage>
  }

  return (
    <div>
      <PageHeader title="All Matches" description="Every ingested job ranked by fit with your profile." />
      {loading && !data ? (
        <LoadingSkeleton rows={6} heightClassName="h-16" />
      ) : (
        <MatchesBrowser
          items={data?.jobMatches.items ?? []}
          total={data?.jobMatches.total ?? 0}
          page={filters.page}
          pageSize={PAGE_SIZE}
          query={filters.draftQuery}
          skill={filters.draftSkill}
          skills={skills}
          hasPendingChanges={filters.hasPendingChanges}
          isLoading={loading}
          onQueryChange={filters.setDraftQuery}
          onSkillChange={filters.setDraftSkill}
          onApply={filters.applyFilters}
          onPageChange={filters.goToPage}
          onSave={handleSave}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  )
}
