'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { ErrorMessage } from '@/components/error-message'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { AllMatchesSkeleton } from './components/all-matches-skeleton'
import { MatchesBrowser } from './components/matches-browser'
import { PAGE_SIZE } from './constants'
import { useMatchFilters } from './hooks/use-match-filters'
import { JOB_MATCHES_QUERY, LOG_INTERACTION_MUTATION, SAVE_JOB_MUTATION, getListingSkills } from './queries'
import type { JobMatchesQueryResult } from './types'

export function AllMatchesPage() {
  const filters = useMatchFilters()
  const [skills, setSkills] = useState<string[]>([])
  // Save/dismiss just hide a job from the current view — the server already excludes
  // saved/dismissed jobs from jobMatches going forward, so there's nothing left to learn
  // from a full requery right now. Refetching here would re-score every job in the feed
  // (each a cache miss right after invalidateMatchScoresForUser) just to reflect one
  // removal — slow, and the other jobs' scores haven't meaningfully changed anyway.
  const [hiddenJobIds, setHiddenJobIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    getListingSkills().then(setSkills)
  }, [])

  const { data, loading, error } = useQuery<JobMatchesQueryResult>(JOB_MATCHES_QUERY, {
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
      setHiddenJobIds((prev) => new Set(prev).add(jobId))
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
      setHiddenJobIds((prev) => new Set(prev).add(jobId))
      toast.success('Job dismissed')
    } catch (dismissError) {
      toast.error('Could not dismiss this job', {
        description: dismissError instanceof Error ? dismissError.message : undefined
      })
    }
  }

  return (
    <div>
      <PageHeader title="All Matches" description="Every ingested job ranked by fit with your profile." />
      {loading && !data ? (
        <AllMatchesSkeleton />
      ) : error ? (
        <ErrorMessage>Could not load job matches: {error.message}</ErrorMessage>
      ) : (
        <MatchesBrowser
          items={(data?.jobMatches.items ?? []).filter((match) => !hiddenJobIds.has(match.job.id))}
          total={Math.max(0, (data?.jobMatches.total ?? 0) - hiddenJobIds.size)}
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
