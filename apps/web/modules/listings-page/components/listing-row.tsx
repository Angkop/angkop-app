'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation } from '@apollo/client/react'
import { Bookmark, BookmarkCheck, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SAVE_JOB_MUTATION } from '@/lib/job-matches'
import { getStoredToken } from '@/lib/auth'
import type { ListingSummary } from '../types'

const MAX_VISIBLE_SKILLS = 6

export function ListingRow({
  listing,
  initiallySaved
}: {
  listing: ListingSummary
  initiallySaved: boolean
}) {
  const visibleSkills = listing.requiredSkills.slice(0, MAX_VISIBLE_SKILLS)
  const hiddenSkillCount = listing.requiredSkills.length - visibleSkills.length
  // Derived, not snapshotted — initiallySaved arrives from an async query that resolves
  // after mount, so a plain useState(initiallySaved) would miss that update.
  const [justSaved, setJustSaved] = useState(false)
  const isSaved = initiallySaved || justSaved
  const [saveJob, { loading: isSaving }] = useMutation(SAVE_JOB_MUTATION)

  async function handleSave() {
    if (!getStoredToken()) {
      toast.error('Sign in to save jobs')
      return
    }
    try {
      await saveJob({ variables: { jobId: listing.id } })
      setJustSaved(true)
      toast.success('Saved to your applications')
    } catch (error) {
      toast.error('Could not save this job', {
        description: error instanceof Error ? error.message : undefined
      })
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/listings/${listing.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{listing.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="size-3 shrink-0" />
            <span className="truncate">{listing.company}</span>
          </p>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant="outline">{listing.sourceName}</Badge>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={isSaved ? 'Saved to your applications' : 'Save job'}
            disabled={isSaved || isSaving}
            onClick={handleSave}
          >
            {isSaved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
          </Button>
        </div>
      </div>
      <Link href={`/listings/${listing.id}`} className="flex flex-wrap gap-1.5">
        {visibleSkills.map((skill) => (
          <Badge key={skill}>{skill}</Badge>
        ))}
        {hiddenSkillCount > 0 ? <Badge variant="outline">+{hiddenSkillCount}</Badge> : null}
      </Link>
    </div>
  )
}
