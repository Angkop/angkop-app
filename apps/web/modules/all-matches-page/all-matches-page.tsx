'use client'

import { NetworkStatus } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { ErrorMessage } from '@/components/error-message'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { SKILL_OPTION_COUNT } from '@/constants/skills'
import { useJobTriage } from '@/hooks/use-job-triage'
import { useSkillSearch } from '@/hooks/use-skill-search'
import { AllMatchesSkeleton } from './components/all-matches-skeleton'
import { MatchesBrowser } from './components/matches-browser'
import { PAGE_SIZE, SKILL_PILL_COUNT } from './constants'
import { useMatchFilters } from './hooks/use-match-filters'
import { JOB_MATCHES_QUERY } from './queries'
import type { JobMatchesQueryResult } from './types'

export function AllMatchesPage() {
  const filters = useMatchFilters()
  // The pills plus one dropdown's worth of skills, not the whole list; the dropdown searches the rest.
  const skillSearch = useSkillSearch({ limit: SKILL_PILL_COUNT + SKILL_OPTION_COUNT })
  const triage = useJobTriage()

  const { data, loading, networkStatus, error, refetch } = useQuery<JobMatchesQueryResult>(JOB_MATCHES_QUERY, {
    variables: {
      page: filters.page,
      pageSize: PAGE_SIZE,
      search: filters.appliedQuery || undefined,
      skill: filters.skill === ALL_FILTER_VALUE ? undefined : filters.skill
    },
    notifyOnNetworkStatusChange: true
  })

  // Saving or dismissing hides the card at once; the page then refetches so the next job moves
  // up into the freed spot instead of leaving the page a card short. Only this page is
  // refetched, and the freed spots show as empty cells until it lands.
  async function refillPage() {
    try {
      const { data: fresh } = await refetch()
      // The last page can empty out, so step back to the one before it.
      if (fresh && fresh.jobMatches.items.length === 0 && filters.page > 1) {
        filters.goToPage(filters.page - 1)
      }
    } catch (refillError) {
      toast.error('Could not refresh your matches', {
        description: refillError instanceof Error ? refillError.message : undefined
      })
    }
  }

  async function handleSave(jobId: string) {
    if (await triage.save(jobId)) await refillPage()
  }

  async function handleDismiss(jobId: string) {
    const didDismiss = await triage.dismiss(jobId)
    if (didDismiss) await refillPage()
    return didDismiss
  }

  const isRefilling = networkStatus === NetworkStatus.refetch
  const allItems = data?.jobMatches.items ?? []
  const items = allItems.filter((match) => !triage.handledJobIds.has(match.job.id))
  // Cards hidden from the data on screen. Once the refetch lands the server has dropped them,
  // so this is 0 again and nothing is subtracted twice.
  const hiddenCount = allItems.length - items.length

  return (
    <div>
      <PageHeader title="All Matches" description="Every ingested job ranked by fit with your profile." />
      {loading && !data && !isRefilling ? (
        <AllMatchesSkeleton />
      ) : error ? (
        <ErrorMessage onRetry={refetch} retryLabel="Reload Matches">
          Could not load job matches: {error.message}
        </ErrorMessage>
      ) : (
        <MatchesBrowser
          items={items}
          total={Math.max(0, (data?.jobMatches.total ?? 0) - hiddenCount)}
          page={filters.page}
          pageSize={PAGE_SIZE}
          query={filters.draftQuery}
          skill={filters.skill}
          skills={skillSearch.defaultSkills}
          skillSearchResults={skillSearch.searchResults}
          isSearchingSkills={skillSearch.isSearching}
          onSearchSkills={skillSearch.search}
          isLoading={loading && !isRefilling}
          pendingSlots={isRefilling ? hiddenCount : 0}
          onQueryChange={filters.setDraftQuery}
          onSkillChange={filters.selectSkill}
          onPageChange={filters.goToPage}
          onSave={handleSave}
          onDismiss={handleDismiss}
          savingJobIds={triage.savingJobIds}
          dismissingJobIds={triage.dismissingJobIds}
        />
      )}
    </div>
  )
}
