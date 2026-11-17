'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { ErrorMessage } from '@/components/error-message'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { SAVED_JOB_DERIVED_FIELDS } from '@/constants/job-cache'
import { invalidateCachedFields } from '@/lib/job-cache'
import { AllMatchesSkeleton } from './components/all-matches-skeleton'
import { MatchesBrowser } from './components/matches-browser'
import { PAGE_SIZE } from './constants'
import { useListingSkills } from './hooks/use-listing-skills'
import { useMatchFilters } from './hooks/use-match-filters'
import { JOB_MATCHES_QUERY, LOG_INTERACTION_MUTATION, SAVE_JOB_MUTATION } from './queries'
import type { JobMatchesQueryResult, JobMatchSummary } from './types'

// Only needed once the user opens a match's explanation, not on every matches page load.
const MatchInsightDialog = dynamic(
  () => import('@/components/match-insight-dialog').then((mod) => mod.MatchInsightDialog),
  { ssr: false }
)

export function AllMatchesPage() {
  const apolloClient = useApolloClient()
  const filters = useMatchFilters()
  const skills = useListingSkills()
  const [insightTarget, setInsightTarget] = useState<JobMatchSummary['job'] | null>(null)
  // Save/dismiss just hide a job from the current view — the server already excludes
  // saved/dismissed jobs from jobMatches going forward, so there's nothing left to learn
  // from a full requery right now. Refetching here would re-score every job in the feed
  // (each a cache miss right after invalidateMatchScoresForUser) just to reflect one
  // removal — slow, and the other jobs' scores haven't meaningfully changed anyway.
  const [hiddenJobIds, setHiddenJobIds] = useState<Set<string>>(new Set())
  // Apollo's mutation `loading` flag is shared across every call made from that one hook
  // instance, so it can't tell which row is in flight when several jobs render at once —
  // track per-job IDs here instead so one row's save/dismiss doesn't disable every row.
  const [savingJobIds, setSavingJobIds] = useState<Set<string>>(new Set())
  const [dismissingJobIds, setDismissingJobIds] = useState<Set<string>>(new Set())

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
    setSavingJobIds((prev) => new Set(prev).add(jobId))
    try {
      await saveJob({ variables: { jobId } })
      setHiddenJobIds((prev) => new Set(prev).add(jobId))
      // Saving changes the saved lists, the skill gap report and which jobs the feed excludes.
      invalidateCachedFields(apolloClient, SAVED_JOB_DERIVED_FIELDS)
      toast.success('Saved to your applications')
    } catch (saveError) {
      toast.error('Could not save this job', {
        description: saveError instanceof Error ? saveError.message : undefined
      })
    } finally {
      setSavingJobIds((prev) => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  async function handleDismiss(jobId: string) {
    setDismissingJobIds((prev) => new Set(prev).add(jobId))
    try {
      await logInteraction({ variables: { jobId, eventType: 'dismiss' } })
      setHiddenJobIds((prev) => new Set(prev).add(jobId))
      invalidateCachedFields(apolloClient, ['jobMatches'])
      toast.success('Job dismissed')
    } catch (dismissError) {
      toast.error('Could not dismiss this job', {
        description: dismissError instanceof Error ? dismissError.message : undefined
      })
    } finally {
      setDismissingJobIds((prev) => {
        const next = new Set(prev)
        next.delete(jobId)
        return next
      })
    }
  }

  return (
    <div>
      <PageHeader title="All Matches" description="Every ingested job ranked by fit with your profile." />
      {loading && !data ? (
        <AllMatchesSkeleton />
      ) : error ? (
        <ErrorMessage onRetry={refetch} retryLabel="Reload Matches">
          Could not load job matches: {error.message}
        </ErrorMessage>
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
          onViewInsight={setInsightTarget}
          savingJobIds={savingJobIds}
          dismissingJobIds={dismissingJobIds}
        />
      )}

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
