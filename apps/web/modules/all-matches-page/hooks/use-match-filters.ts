import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { withSearchParams } from '@/lib/utils'

export function useMatchFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const appliedQuery = searchParams.get('q') ?? ''
  const appliedSkill = searchParams.get('skill') ?? ALL_FILTER_VALUE

  // Staged filter values — only take effect once "Apply Filters" is clicked.
  const [draftQuery, setDraftQuery] = useState(appliedQuery)
  const [draftSkill, setDraftSkill] = useState(appliedSkill)

  const hasPendingChanges = draftQuery !== appliedQuery || draftSkill !== appliedSkill

  useEffect(() => {
    setDraftQuery(appliedQuery)
    setDraftSkill(appliedSkill)
  }, [appliedQuery, appliedSkill])

  function updateParams(patch: Record<string, string | number | undefined>) {
    const next = withSearchParams(searchParams, patch)
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
  }

  function applyFilters() {
    updateParams({
      q: draftQuery || undefined,
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
    appliedSkill,
    draftQuery,
    setDraftQuery,
    draftSkill,
    setDraftSkill,
    hasPendingChanges,
    applyFilters,
    goToPage
  }
}
