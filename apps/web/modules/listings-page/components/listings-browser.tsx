'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ListingSummary } from '../types'
import { ListingRow } from './listing-row'

const PAGE_SIZE = 12
const ALL_SOURCES = 'all'

export function ListingsBrowser({ listings }: { listings: ListingSummary[] }) {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState(ALL_SOURCES)
  const [page, setPage] = useState(1)

  const sources = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.sourceName))).sort(),
    [listings]
  )

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return listings.filter((listing) => {
      if (source !== ALL_SOURCES && listing.sourceName !== source) return false
      if (!normalized) return true
      return (
        listing.title.toLowerCase().includes(normalized) ||
        listing.company.toLowerCase().includes(normalized) ||
        listing.requiredSkills.some((skill) => skill.toLowerCase().includes(normalized))
      )
    })
  }, [listings, query, source])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function updateQuery(value: string) {
    setQuery(value)
    setPage(1)
  }

  function updateSource(value: string) {
    setSource(value)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search by title, company, or skill"
              className="pl-8"
            />
          </div>
          <Select value={source} onValueChange={updateSource}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SOURCES}>All sources</SelectItem>
              {sources.map((sourceName) => (
                <SelectItem key={sourceName} value={sourceName}>
                  {sourceName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {listings.length} job{listings.length === 1 ? '' : 's'}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No jobs match these filters — try a different search or source.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {paged.map((listing) => (
              <ListingRow key={listing.id} listing={listing} />
            ))}
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {pageCount}
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === pageCount}
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
