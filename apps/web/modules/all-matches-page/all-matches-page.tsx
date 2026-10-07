'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@apollo/client/react'
import { PageHeader } from '@/components/page-header'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
import { withSearchParams } from '@/lib/utils'
import {
  JOB_MATCHES_QUERY,
  LOG_INTERACTION_MUTATION,
  SAVE_JOB_MUTATION
} from '@/modules/dashboard-page/queries'
import type { JobMatchesQueryResult } from '@/modules/dashboard-page/types'
import { getListingSkills } from '@/modules/listings-page/queries'
import { MatchesBrowser } from './components/matches-browser'

const PAGE_SIZE = 15
const ALL_SKILLS = 'all'

export function AllMatchesPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const appliedQuery = searchParams.get('q') ?? ''
  const appliedSkill = searchParams.get('skill') ?? ALL_SKILLS

  // Staged filter values — only take effect once "Apply Filters" is clicked.
  const [draftQuery, setDraftQuery] = useState(appliedQuery)
  const [draftSkill, setDraftSkill] = useState(appliedSkill)
  const [skills, setSkills] = useState<string[]>([])

  const hasPendingChanges = draftQuery !== appliedQuery || draftSkill !== appliedSkill

  useEffect(() => {
    setDraftQuery(appliedQuery)
    setDraftSkill(appliedSkill)
  }, [appliedQuery, appliedSkill])

  useEffect(() => {
    getListingSkills().then(setSkills)
  }, [])

  function updateParams(patch: Record<string, string | number | undefined>) {
    const next = withSearchParams(searchParams, patch)
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }

  function applyFilters() {
    updateParams({
      q: draftQuery || undefined,
      skill: draftSkill === ALL_SKILLS ? undefined : draftSkill,
      page: undefined
    })
  }

  const { data, loading, error, refetch } = useQuery<JobMatchesQueryResult>(JOB_MATCHES_QUERY, {
    variables: {
      page,
      pageSize: PAGE_SIZE,
      search: appliedQuery || undefined,
      skill: appliedSkill === ALL_SKILLS ? undefined : appliedSkill
    },
    notifyOnNetworkStatusChange: true
  })
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
          page={page}
          pageSize={PAGE_SIZE}
          query={draftQuery}
          skill={draftSkill}
          skills={skills}
          hasPendingChanges={hasPendingChanges}
          isLoading={loading}
          onQueryChange={setDraftQuery}
          onSkillChange={setDraftSkill}
          onApply={applyFilters}
          onPageChange={(next) => updateParams({ page: next === 1 ? undefined : next })}
          onSave={handleSave}
          onDismiss={handleDismiss}
        />
      )}
    </div>
  )
}
