'use client'

import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { FilterSelect } from '@/components/common/filter-select'
import { SearchInput } from '@/components/common/form/search-input'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { PaginationControls } from '@/components/pagination-controls'
import { Button } from '@/components/ui/button'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { useSkillSearch } from '@/hooks/use-skill-search'
import { getStoredToken } from '@/lib/auth'
import { SAVED_JOB_IDS_QUERY, type SavedJobIdsQueryResult } from '@/lib/job-matches'
import { useListingsFilters } from '../hooks/use-listings-filters'
import type { ListingsPageResponse } from '../types'
import { ListingRow } from './listing-row'

export function ListingsBrowser({
  listings,
  sources,
  skills,
  pageSize
}: {
  listings: ListingsPageResponse
  sources: string[]
  skills: string[]
  pageSize: number
}) {
  const filters = useListingsFilters()

  // Skipped entirely for anonymous browsing — /listings itself is public, this just adds
  // "which of these are already bookmarked" on top for a signed-in viewer.
  const { data: savedJobIdsData } = useQuery<SavedJobIdsQueryResult>(SAVED_JOB_IDS_QUERY, {
    skip: !getStoredToken()
  })
  const savedJobIds = useMemo(() => new Set(savedJobIdsData?.savedJobIds ?? []), [savedJobIdsData])

  const sourceOptions = useMemo(() => sources.map((name) => ({ value: name, label: name })), [sources])
  // `skills` is only the few most-asked ones the server rendered; the dropdown searches the rest.
  const skillSearch = useSkillSearch({ initialSkills: skills })
  const skillOptions = useMemo(
    () => (skillSearch.searchResults ?? skillSearch.defaultSkills).map((name) => ({ value: name, label: name })),
    [skillSearch.searchResults, skillSearch.defaultSkills]
  )

  const pageCount = Math.max(1, Math.ceil(listings.total / pageSize))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput
            value={filters.draftQuery}
            onValueChange={filters.setDraftQuery}
            onKeyDown={(event) => {
              if (event.key === 'Enter') filters.applyFilters()
            }}
            placeholder="Search by title or company"
            aria-label="Search by title or company"
            className="w-full sm:w-64"
          />
          <FilterSelect
            label="Source"
            multiple={false}
            options={sourceOptions}
            value={filters.draftSource === ALL_FILTER_VALUE ? [] : [filters.draftSource]}
            onValueChange={(next) => filters.setDraftSource(next[0] ?? ALL_FILTER_VALUE)}
          />
          <FilterSelect
            label="Skill"
            multiple={false}
            options={skillOptions}
            searchPlaceholder="Search skills"
            emptyMessage="No skills match this search. Try a different word."
            onSearch={skillSearch.search}
            isLoading={skillSearch.isSearching}
            value={filters.draftSkill === ALL_FILTER_VALUE ? [] : [filters.draftSkill]}
            onValueChange={(next) => filters.setDraftSkill(next[0] ?? ALL_FILTER_VALUE)}
          />
          <Button size="sm" onClick={filters.applyFilters} disabled={!filters.hasPendingChanges}>
            Apply Filters
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {listings.total} job{listings.total === 1 ? '' : 's'}
        </p>
      </div>

      {filters.isPending ? (
        <LoadingSkeleton rows={4} heightClassName="h-20" />
      ) : listings.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No jobs match these filters. Try a different search, source, or skill.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {listings.items.map((listing) => (
            <ListingRow key={listing.id} listing={listing} initiallySaved={savedJobIds.has(listing.id)} />
          ))}
        </div>
      )}

      <PaginationControls page={filters.page} pageCount={pageCount} onChange={filters.goToPage} />
    </div>
  )
}
