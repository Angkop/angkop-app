import { useState } from 'react'
import { Calendar, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus, type SavedJob } from '@angkop/shared'
import { Button } from '@/components/ui/button'
import { ChipList } from '@/components/chip-list'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MatchScoreBadge } from '@/components/match-score-badge'
import { STATUS_ORDER } from '../constants'

export function ApplicationCard({
  savedJob,
  onStatusChange,
  onInterviewDateChange,
  onAddTag,
  onRemoveTag,
  onUnsave,
  onViewInsight
}: {
  savedJob: SavedJob
  onStatusChange: (jobId: string, status: ApplicationStatus) => void
  onInterviewDateChange: (jobId: string, interviewDate: string) => void
  onAddTag: (jobId: string, tag: string) => void
  onRemoveTag: (jobId: string, tag: string) => void
  onUnsave: (jobId: string) => void
  onViewInsight: (savedJob: SavedJob) => void
}) {
  const [confirmUnsaveOpen, setConfirmUnsaveOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link href={`/listings/${savedJob.job.id}`} className="min-w-0 hover:underline">
          <p className="truncate text-sm font-medium text-foreground">{savedJob.job.title}</p>
          <p className="truncate text-xs text-muted-foreground">{savedJob.job.company}</p>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="View match details"
            onClick={() => onViewInsight(savedJob)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Remove application"
            onClick={() => setConfirmUnsaveOpen(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <MatchScoreBadge score={savedJob.hybridScore} />

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor={`status-${savedJob.id}`} className="text-[11px] font-medium text-muted-foreground">
            Status
          </label>
          <Select
            value={savedJob.status}
            onValueChange={(value) => onStatusChange(savedJob.job.id, value as ApplicationStatus)}
          >
            <SelectTrigger id={`status-${savedJob.id}`} className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ORDER.map((status) => (
                <SelectItem key={status} value={status}>
                  {APPLICATION_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor={`interview-date-${savedJob.id}`}
            className="text-[11px] font-medium text-muted-foreground"
          >
            Interview Date
          </label>
          <div className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5 shrink-0 text-muted-foreground" />
            <Input
              id={`interview-date-${savedJob.id}`}
              type="date"
              value={savedJob.interviewDate ? savedJob.interviewDate.slice(0, 10) : ''}
              onChange={(event) => onInterviewDateChange(savedJob.job.id, event.target.value)}
              className="h-8 w-36 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium text-muted-foreground">Tags</p>
        <ChipList
          items={savedJob.tags}
          onAdd={(tag) => onAddTag(savedJob.job.id, tag)}
          onRemove={(tag) => onRemoveTag(savedJob.job.id, tag)}
          placeholder="e.g. Dream job"
        />
      </div>

      <ConfirmDialog
        open={confirmUnsaveOpen}
        onOpenChange={setConfirmUnsaveOpen}
        title="Remove this application?"
        description={`"${savedJob.job.title}" at ${savedJob.job.company} will be removed from your tracked applications, including its status, tags, and interview date.`}
        confirmLabel="Remove"
        onConfirm={() => onUnsave(savedJob.job.id)}
      />
    </div>
  )
}
