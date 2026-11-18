import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { withSearchParams } from '@/lib/utils'
import { SEARCH_DEBOUNCE_MS } from '../constants'

export function useMatchFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const appliedQuery = searchParams.get('q') ?? ''
  const skill = searchParams.get('skill') ?? ALL_FILTER_VALUE

  // What's typed in the search box. It reaches the URL (and so the query) after a pause in
  // typing, so every keystroke isn't a request. The skill pills apply as soon as they're picked.
  const [draftQuery, setDraftQuery] = useState(appliedQuery)

  const updateParams = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      const next = withSearchParams(searchParams, patch)
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  // Follows back/forward navigation, which changes the URL without touching the search box.
  useEffect(() => {
    setDraftQuery(appliedQuery)
  }, [appliedQuery])

  useEffect(() => {
    if (draftQuery === appliedQuery) return
    const timer = setTimeout(() => {
      updateParams({ q: draftQuery || undefined, page: undefined })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draftQuery, appliedQuery, updateParams])

  function selectSkill(nextSkill: string) {
    updateParams({ skill: nextSkill === ALL_FILTER_VALUE ? undefined : nextSkill, page: undefined })
  }

  function goToPage(nextPage: number) {
    updateParams({ page: nextPage === 1 ? undefined : nextPage })
  }

  return {
    page,
    appliedQuery,
    skill,
    draftQuery,
    setDraftQuery,
    selectSkill,
    goToPage
  }
}
