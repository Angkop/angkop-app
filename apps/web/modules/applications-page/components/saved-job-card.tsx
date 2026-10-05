import { Calendar, X } from 'lucide-react'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus, type SavedJob } from '@angkop/shared'
import { Button } from '@/components/ui/button'
import { ChipList } from '@/components/chip-list'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { STATUS_ORDER } from '../constants'

export function SavedJobCard({
  savedJob,
  onStatusChange,
  onInterviewDateChange,
  onAddTag,
  onRemoveTag,
  onUnsave
}: {
  savedJob: SavedJob
  onStatusChange: (jobId: string, status: ApplicationStatus) => void
  onInterviewDateChange: (jobId: string, interviewDate: string) => void
  onAddTag: (jobId: string, tag: string) => void
  onRemoveTag: (jobId: string, tag: string) => void
  onUnsave: (jobId: string) => void
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{savedJob.job.title}</p>
          <p className="text-xs text-muted-foreground">{savedJob.job.company}</p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Unsave job" onClick={() => onUnsave(savedJob.job.id)}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select
          value={savedJob.status}
          onValueChange={(value) => onStatusChange(savedJob.job.id, value as ApplicationStatus)}
        >
          <SelectTrigger className="w-48">
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

        <div className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5 text-muted-foreground" />
          <Input
            type="date"
            value={savedJob.interviewDate ? savedJob.interviewDate.slice(0, 10) : ''}
            onChange={(event) => onInterviewDateChange(savedJob.job.id, event.target.value)}
            className="h-8 w-36 text-xs"
          />
        </div>
      </div>

      <div className="mt-3">
        <ChipList
          items={savedJob.tags}
          onAdd={(tag) => onAddTag(savedJob.job.id, tag)}
          onRemove={(tag) => onRemoveTag(savedJob.job.id, tag)}
          placeholder="e.g. Dream job"
        />
      </div>
    </div>
  )
}
