import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { withSearchParams } from '@/lib/utils'

export function useListingsFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const appliedQuery = searchParams.get('q') ?? ''
  const appliedSource = searchParams.get('source') ?? ALL_FILTER_VALUE
  const appliedSkill = searchParams.get('skill') ?? ALL_FILTER_VALUE

  // Staged filter values — only take effect once "Apply Filters" is clicked, not as
  // each control changes, so the result list doesn't shift under you mid-selection.
  const [draftQuery, setDraftQuery] = useState(appliedQuery)
  const [draftSource, setDraftSource] = useState(appliedSource)
  const [draftSkill, setDraftSkill] = useState(appliedSkill)

  const hasPendingChanges =
    draftQuery !== appliedQuery || draftSource !== appliedSource || draftSkill !== appliedSkill

  // Keep drafts in sync with the URL when it changes from outside this form — back/forward
  // navigation, or a shared link that already has filters on it.
  useEffect(() => {
    setDraftQuery(appliedQuery)
    setDraftSource(appliedSource)
    setDraftSkill(appliedSkill)
  }, [appliedQuery, appliedSource, appliedSkill])

  function updateParams(patch: Record<string, string | number | undefined>) {
    const next = withSearchParams(searchParams, patch)
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }

  function applyFilters() {
    updateParams({
      q: draftQuery || undefined,
      source: draftSource === ALL_FILTER_VALUE ? undefined : draftSource,
      skill: draftSkill === ALL_FILTER_VALUE ? undefined : draftSkill,
      page: undefined
    })
  }

  function goToPage(nextPage: number) {
    updateParams({ page: nextPage === 1 ? undefined : nextPage })
  }

  return {
    page,
    appliedQuery,
    appliedSource,
    appliedSkill,
    draftQuery,
    setDraftQuery,
    draftSource,
    setDraftSource,
    draftSkill,
    setDraftSkill,
    hasPendingChanges,
    applyFilters,
    goToPage
  }
}
