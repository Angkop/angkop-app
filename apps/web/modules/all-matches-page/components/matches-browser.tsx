'use client'

import { Search, SearchX } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { MatchCard } from '@/components/match-card'
import { MatchGrid } from '@/components/match-grid'
import { NavLink } from '@/components/nav-link'
import { PaginationControls } from '@/components/pagination-controls'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import type { JobMatchSummary } from '../types'
import { MatchCardSkeleton, MatchesGridSkeleton } from './all-matches-skeleton'
import { SkillFilter } from './skill-filter'

export function MatchesBrowser({
  items,
  total,
  page,
  pageSize,
  query,
  skill,
  skills,
  isLoading,
  pendingSlots,
  onQueryChange,
  onSkillChange,
  onPageChange,
  onSave,
  onDismiss,
  savingJobIds,
  dismissingJobIds
}: {
  items: JobMatchSummary[]
  total: number
  page: number
  pageSize: number
  query: string
  skill: string
  skills: string[]
  isLoading: boolean
  // Jobs just saved or dismissed whose replacements are still loading, one empty cell each.
  pendingSlots: number
  onQueryChange: (value: string) => void
  onSkillChange: (value: string) => void
  onPageChange: (page: number) => void
  onSave: (jobId: string) => void
  onDismiss: (jobId: string) => Promise<boolean>
  savingJobIds: Set<string>
  dismissingJobIds: Set<string>
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const hasFilters = Boolean(query) || skill !== ALL_FILTER_VALUE

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by title, company, or skill"
              aria-label="Search matches"
              className="pl-8"
            />
          </div>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {total} match{total === 1 ? '' : 'es'}
          </p>
        </div>
        <SkillFilter skills={skills} selected={skill} onSelect={onSkillChange} />
      </div>

      {isLoading ? (
        <MatchesGridSkeleton />
      ) : items.length === 0 && pendingSlots === 0 ? (
        <EmptyState
          icon={SearchX}
          title={hasFilters ? 'No matches for these filters' : 'No job matches yet'}
          description={
            hasFilters
              ? 'Try a different search, or pick another skill or All to see every match.'
              : 'New postings are added regularly. Browse the listings now, or add skills to your profile so more jobs can be matched.'
          }
          action={
            hasFilters ? undefined : (
              <NavLink
                href="/listings"
                pendingLabel="Loading listings…"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Browse Listings
              </NavLink>
            )
          }
        />
      ) : (
        <>
          <MatchGrid>
            {items.map((match) => (
              <MatchCard
                key={match.job.id}
                job={match.job}
                score={match.hybridScore}
                onSave={onSave}
                onDismiss={onDismiss}
                isSaving={savingJobIds.has(match.job.id)}
                isDismissing={dismissingJobIds.has(match.job.id)}
              />
            ))}
            {Array.from({ length: pendingSlots }, (_, index) => (
              <MatchCardSkeleton key={`pending-${index}`} />
            ))}
          </MatchGrid>

          <PaginationControls page={page} pageCount={pageCount} onChange={onPageChange} />
        </>
      )}
    </div>
  )
}
