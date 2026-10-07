'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { PaginationControls } from '@/components/pagination-controls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { useListingsFilters } from '../hooks/use-listings-filters'
import { getListings } from '../queries'
import type { ListingsPageResponse } from '../types'
import { ListingRow } from './listing-row'

export function ListingsBrowser({
  initialPage,
  sources,
  skills,
  pageSize
}: {
  initialPage: ListingsPageResponse
  sources: string[]
  skills: string[]
  pageSize: number
}) {
  const filters = useListingsFilters()
  const [data, setData] = useState(initialPage)
  const [isLoading, setIsLoading] = useState(false)

  // Refetch whenever the URL's *applied* filters/page actually change.
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getListings({
      page: filters.page,
      pageSize,
      q: filters.appliedQuery || undefined,
      source: filters.appliedSource === ALL_FILTER_VALUE ? undefined : filters.appliedSource,
      skill: filters.appliedSkill === ALL_FILTER_VALUE ? undefined : filters.appliedSkill
    }).then((result) => {
      if (cancelled) return
      setData(result)
      setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [filters.page, pageSize, filters.appliedQuery, filters.appliedSource, filters.appliedSkill])

  const pageCount = Math.max(1, Math.ceil(data.total / pageSize))

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
          {data.total} job{data.total === 1 ? '' : 's'}
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} heightClassName="h-20" />
      ) : data.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No jobs match these filters — try a different search, source, or skill.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.items.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      <PaginationControls page={filters.page} pageCount={pageCount} onChange={filters.goToPage} />
    </div>
  )
}
