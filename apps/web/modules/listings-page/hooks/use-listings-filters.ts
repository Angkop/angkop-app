import { useCallback, useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { withSearchParams } from '@/lib/utils'
import { SEARCH_DEBOUNCE_MS } from '../constants'

export function useListingsFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Changing the URL re-renders the server page with the new results; the transition's
  // pending flag is what lets the list show a loading state while that happens.
  const [isPending, startTransition] = useTransition()

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

  // The title search this hook itself last put in the URL. The URL only catches up after the server
  // has rendered the new page, and by then more letters may have been typed; without this, that
  // late URL change would overwrite them with the older text.
  const [pushedQuery, setPushedQuery] = useState(appliedQuery)
  const [seenAppliedQuery, setSeenAppliedQuery] = useState(appliedQuery)

  // The URL's title search changed. If it is the one this hook just pushed, the draft already has
  // it (or newer); otherwise it came from outside this form — back/forward navigation, or a shared
  // link that already has a search on it — and the draft follows. Adjusted during render, not in an
  // effect, so it runs only when the URL value changes and not when pushedQuery does.
  if (appliedQuery !== seenAppliedQuery) {
    setSeenAppliedQuery(appliedQuery)
    if (appliedQuery !== pushedQuery) {
      setDraftQuery(appliedQuery)
      setPushedQuery(appliedQuery)
    }
  }

  // Source and skill follow the URL the same way when it changes from outside this form.
  useEffect(() => {
    setDraftSource(appliedSource)
    setDraftSkill(appliedSkill)
  }, [appliedSource, appliedSkill])

  const updateParams = useCallback(
    (patch: Record<string, string | number | undefined>) => {
      const next = withSearchParams(searchParams, patch)
      startTransition(() => {
        router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false })
      })
    },
    [router, pathname, searchParams]
  )

  // The title search applies after a pause in typing, on its own. Source and skill stay staged
  // behind "Apply Filters"; only the text reaches the URL here, so drafts of those two are untouched.
  useEffect(() => {
    if (draftQuery === pushedQuery) return
    const timer = setTimeout(() => {
      setPushedQuery(draftQuery)
      updateParams({ q: draftQuery || undefined, page: undefined })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draftQuery, pushedQuery, updateParams])

  function applyFilters() {
    setPushedQuery(draftQuery)
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
    isPending,
    applyFilters,
    goToPage
  }
}
