'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { JobMatch } from '@angkop/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { JobRow } from '@/components/job-row'

const PAGE_SIZE = 15

export function MatchesBrowser({
  matches,
  onSave,
  onDismiss
}: {
  matches: JobMatch[]
  onSave: (jobId: string) => void
  onDismiss: (jobId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return matches
    return matches.filter(
      (match) =>
        match.job.title.toLowerCase().includes(normalized) ||
        match.job.company.toLowerCase().includes(normalized) ||
        match.job.requiredSkills.some((skill) => skill.toLowerCase().includes(normalized))
    )
  }, [matches, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function updateQuery(value: string) {
    setQuery(value)
    setPage(1)
  }

  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No job matches yet. Run the seed script to load sample postings, then refresh.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Search by title, company, or skill"
            className="pl-8"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {matches.length} match{matches.length === 1 ? '' : 'es'}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No matches found for &ldquo;{query}&rdquo; — try a different search.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {paged.map((match) => (
              <JobRow
                key={match.job.id}
                job={match.job}
                score={match.hybridScore}
                onSave={onSave}
                onDismiss={onDismiss}
              />
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
