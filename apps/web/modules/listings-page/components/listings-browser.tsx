'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { PaginationControls } from '@/components/pagination-controls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { withSearchParams } from '@/lib/utils'
import { getListings } from '../queries'
import type { ListingsPageResponse } from '../types'
import { ListingRow } from './listing-row'

const ALL_SOURCES = 'all'
const ALL_SKILLS = 'all'

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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get('page')) || 1
  const appliedQuery = searchParams.get('q') ?? ''
  const appliedSource = searchParams.get('source') ?? ALL_SOURCES
  const appliedSkill = searchParams.get('skill') ?? ALL_SKILLS

  // Staged filter values — only take effect once "Apply Filters" is clicked, not as
  // each control changes, so the result list doesn't shift under you mid-selection.
  const [draftQuery, setDraftQuery] = useState(appliedQuery)
  const [draftSource, setDraftSource] = useState(appliedSource)
  const [draftSkill, setDraftSkill] = useState(appliedSkill)

  const [data, setData] = useState(initialPage)
  const [isLoading, setIsLoading] = useState(false)

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
      source: draftSource === ALL_SOURCES ? undefined : draftSource,
      skill: draftSkill === ALL_SKILLS ? undefined : draftSkill,
      page: undefined
    })
  }

  // Refetch whenever the URL's *applied* filters/page actually change.
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getListings({
      page,
      pageSize,
      q: appliedQuery || undefined,
      source: appliedSource === ALL_SOURCES ? undefined : appliedSource,
      skill: appliedSkill === ALL_SKILLS ? undefined : appliedSkill
    }).then((result) => {
      if (cancelled) return
      setData(result)
      setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [page, pageSize, appliedQuery, appliedSource, appliedSkill])

  const pageCount = Math.max(1, Math.ceil(data.total / pageSize))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') applyFilters()
              }}
              placeholder="Search by title or company"
              className="pl-8"
            />
          </div>
          <Select value={draftSource} onValueChange={setDraftSource}>
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
          <Select value={draftSkill} onValueChange={setDraftSkill}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SKILLS}>All skills</SelectItem>
              {skills.map((skillName) => (
                <SelectItem key={skillName} value={skillName}>
                  {skillName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={applyFilters} disabled={!hasPendingChanges}>
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

      <PaginationControls page={page} pageCount={pageCount} onChange={(next) => updateParams({ page: next === 1 ? undefined : next })} />
    </div>
  )
}
