'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Archive, Bookmark, Loader2, Target } from 'lucide-react'
import type { Job } from '@angkop/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { MatchScoreBadge } from '@/components/match-score-badge'
import { MatchInsightDialog } from '@/components/match-insight-dialog'

type JobRowProps = {
  job: Job
  score: number
  onSave?: (jobId: string) => void
  onDismiss?: (jobId: string) => Promise<void>
  isSaving?: boolean
  isDismissing?: boolean
}

export function JobRow({ job, score, onSave, onDismiss, isSaving = false, isDismissing = false }: JobRowProps) {
  const [insightOpen, setInsightOpen] = useState(false)
  const [confirmDismissOpen, setConfirmDismissOpen] = useState(false)

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:border-foreground/20">
      <Link href={`/listings/${job.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <MatchScoreBadge score={score} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{job.title}</p>
          <p className="truncate text-xs text-muted-foreground">{job.company}</p>
        </div>
        {job.sourceName ? (
          <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
            {job.sourceName}
          </Badge>
        ) : null}
      </Link>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="Why this is a match" onClick={() => setInsightOpen(true)}>
          <Target className="size-4" />
        </Button>
        {onSave ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isSaving ? 'Saving job' : 'Save job'}
            disabled={isSaving}
            onClick={() => onSave(job.id)}
          >
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className="size-4" />}
          </Button>
        ) : null}
        {onDismiss ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={isDismissing ? 'Dismissing job' : 'Dismiss job'}
            disabled={isDismissing}
            onClick={() => setConfirmDismissOpen(true)}
          >
            {isDismissing ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
          </Button>
        ) : null}
      </div>

      <MatchInsightDialog
        open={insightOpen}
        onOpenChange={setInsightOpen}
        jobId={job.id}
        jobTitle={job.title}
        jobCompany={job.company}
      />

      {onDismiss ? (
        <ConfirmDialog
          open={confirmDismissOpen}
          onOpenChange={setConfirmDismissOpen}
          title="Dismiss this job?"
          description={`"${job.title}" at ${job.company} won't show up in your matches again.`}
          confirmLabel="Dismiss"
          confirmingLabel="Dismissing…"
          isConfirming={isDismissing}
          onConfirm={async () => {
            await onDismiss(job.id)
            setConfirmDismissOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
