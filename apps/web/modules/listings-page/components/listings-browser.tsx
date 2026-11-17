'use client'

import { useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { Search } from 'lucide-react'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { PaginationControls } from '@/components/pagination-controls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ALL_FILTER_VALUE } from '@/constants/filters'
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

  const pageCount = Math.max(1, Math.ceil(listings.total / pageSize))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.draftQuery}
              onChange={(event) => filters.setDraftQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') filters.applyFilters()
              }}
              placeholder="Search by title or company"
              className="pl-8"
            />
          </div>
          <Select value={filters.draftSource} onValueChange={filters.setDraftSource}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All sources</SelectItem>
              {sources.map((sourceName) => (
                <SelectItem key={sourceName} value={sourceName}>
                  {sourceName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.draftSkill} onValueChange={filters.setDraftSkill}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FILTER_VALUE}>All skills</SelectItem>
              {skills.map((skillName) => (
                <SelectItem key={skillName} value={skillName}>
                  {skillName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
