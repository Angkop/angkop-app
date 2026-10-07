'use client'

import { Search } from 'lucide-react'
import type { JobMatch } from '@angkop/shared'
import { JobRow } from '@/components/job-row'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { PaginationControls } from '@/components/pagination-controls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ALL_FILTER_VALUE } from '@/constants/filters'

export function MatchesBrowser({
  items,
  total,
  page,
  pageSize,
  query,
  skill,
  skills,
  hasPendingChanges,
  isLoading,
  onQueryChange,
  onSkillChange,
  onApply,
  onPageChange,
  onSave,
  onDismiss
}: {
  items: JobMatch[]
  total: number
  page: number
  pageSize: number
  query: string
  skill: string
  skills: string[]
  hasPendingChanges: boolean
  isLoading: boolean
  onQueryChange: (value: string) => void
  onSkillChange: (value: string) => void
  onApply: () => void
  onPageChange: (page: number) => void
  onSave: (jobId: string) => void
  onDismiss: (jobId: string) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onApply()
              }}
              placeholder="Search by title, company, or skill"
              className="pl-8"
            />
          </div>
          <Select value={skill} onValueChange={onSkillChange}>
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
          <Button size="sm" onClick={onApply} disabled={!hasPendingChanges}>
            Apply Filters
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {total} match{total === 1 ? '' : 'es'}
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} heightClassName="h-16" />
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {query || skill !== ALL_FILTER_VALUE ? (
            'No matches found for these filters — try a different search or skill.'
          ) : (
            <>
              No job matches yet. Run{' '}
              <code className="rounded bg-muted px-1 py-0.5">pnpm --filter @angkop/server run ingest:jobs</code> to
              pull in real listings, then refresh.
            </>
          )}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {items.map((match) => (
              <JobRow
                key={match.job.id}
                job={match.job}
                score={match.hybridScore}
                onSave={onSave}
                onDismiss={onDismiss}
              />
            ))}
          </div>

          <PaginationControls page={page} pageCount={pageCount} onChange={onPageChange} />
        </>
      )}
    </div>
  )
}
