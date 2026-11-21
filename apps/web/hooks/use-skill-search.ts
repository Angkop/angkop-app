import { useCallback, useEffect, useRef, useState } from 'react'
import { SKILL_OPTION_COUNT } from '@/constants/skills'
import { getListingSkills } from '@/lib/jobs-api'

// One request per (limit, browser session) for the default list, since the most-asked skills
// barely change between ingestion runs. A failure or an empty answer isn't kept, so the next
// mount tries again instead of leaving the dropdown empty until a full reload.
const defaultSkillRequests = new Map<number, Promise<string[]>>()

function loadDefaultSkills(limit: number): Promise<string[]> {
  const existing = defaultSkillRequests.get(limit)
  if (existing) return existing
  const request = getListingSkills({ limit })
    .catch(() => [])
    .then((skills) => {
      if (skills.length === 0) defaultSkillRequests.delete(limit)
      return skills
    })
  defaultSkillRequests.set(limit, request)
  return request
}

// The skill dropdowns never hold the whole skill list: `defaultSkills` is the few most-asked
// ones, and `search` asks the server for the skills matching what was typed. Pass `initialSkills`
// when the page already has the defaults (a server-rendered page) to skip the first request.
// `searchResults` is null while nothing is being searched, so callers fall back to the defaults.
export function useSkillSearch({
  initialSkills,
  limit = SKILL_OPTION_COUNT
}: { initialSkills?: string[]; limit?: number } = {}) {
  const [defaultSkills, setDefaultSkills] = useState<string[]>(initialSkills ?? [])
  const [searchResults, setSearchResults] = useState<string[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  // The request for the latest search; an older one still in flight is abandoned, so a slow
  // answer for "rea" can never replace the answer for "react".
  const searchController = useRef<AbortController | null>(null)

  const hasInitialSkills = initialSkills !== undefined
  useEffect(() => {
    if (hasInitialSkills) return
    let isMounted = true
    loadDefaultSkills(limit).then((loaded) => {
      if (isMounted) setDefaultSkills(loaded)
    })
    return () => {
      isMounted = false
    }
  }, [hasInitialSkills, limit])

  useEffect(() => () => searchController.current?.abort(), [])

  const search = useCallback((query: string) => {
    searchController.current?.abort()
    const text = query.trim()
    if (!text) {
      setSearchResults(null)
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    searchController.current = controller
    setIsSearching(true)
    getListingSkills({ q: text, limit: SKILL_OPTION_COUNT, signal: controller.signal })
      .then((skills) => {
        setSearchResults(skills)
        setIsSearching(false)
      })
      .catch(() => {
        // An abandoned search is not a failure; only a real one clears the list.
        if (controller.signal.aborted) return
        setSearchResults([])
        setIsSearching(false)
      })
  }, [])

  return { defaultSkills, searchResults, isSearching, search }
}
