'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { toast } from 'sonner'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus, type SavedJob } from '@angkop/shared'
import { PageHeader } from '@/components/page-header'
import { ErrorMessage } from '@/components/error-message'
import { PaginationControls } from '@/components/pagination-controls'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { ApplicationStatsRow } from './components/application-stats-row'
import { ApplicationCard } from './components/application-card'
import { ApplicationsSkeleton } from './components/applications-skeleton'
import { ApplicationInsightDialog } from './components/application-insight-dialog'
import { PAGE_SIZE, STATUS_ORDER } from './constants'
import {
  ADD_TAG_MUTATION,
  REMOVE_TAG_MUTATION,
  SAVED_JOBS_QUERY,
  SAVED_JOB_STATS_QUERY,
  SET_INTERVIEW_DATE_MUTATION,
  UNSAVE_JOB_MUTATION,
  UPDATE_STATUS_MUTATION
} from './queries'

type SavedJobsQueryResult = {
  savedJobs: { items: SavedJob[]; total: number }
}

type SavedJobStats = {
  total: number
  inProgress: number
  upcomingInterviews: number
  successful: number
}

type SavedJobStatsQueryResult = {
  savedJobStats: SavedJobStats
}

type JobPendingState = {
  status: boolean
  interviewDate: boolean
  removingTag: string | null
  unsave: boolean
}

const EMPTY_PENDING_STATE: JobPendingState = {
  status: false,
  interviewDate: false,
  removingTag: null,
  unsave: false
}

export function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER_VALUE)
  const [page, setPage] = useState(1)
  const [insightTarget, setInsightTarget] = useState<SavedJob | null>(null)
  // Each card has five independently-triggerable mutations, and Apollo's mutation `loading`
  // is shared across every row — keyed per-job state is what lets one job's tag edit stay
  // disabled without freezing every other card's controls too.
  const [pendingByJob, setPendingByJob] = useState<Record<string, JobPendingState>>({})

  function getPending(jobId: string): JobPendingState {
    return pendingByJob[jobId] ?? EMPTY_PENDING_STATE
  }

  function setPendingField<K extends keyof JobPendingState>(jobId: string, field: K, value: JobPendingState[K]) {
    setPendingByJob((prev) => ({
      ...prev,
      [jobId]: { ...(prev[jobId] ?? EMPTY_PENDING_STATE), [field]: value }
    }))
  }

  const status = statusFilter === ALL_FILTER_VALUE ? undefined : (statusFilter as ApplicationStatus)

  // cache-and-network, not the default cache-first — saving a job happens from Listings
  // or Matches, not this page, so a cached result here would otherwise keep showing the
  // list from before that save until the user hard-refreshes.
  const { data, loading, error, refetch } = useQuery<SavedJobsQueryResult>(SAVED_JOBS_QUERY, {
    variables: { page, pageSize: PAGE_SIZE, status },
    fetchPolicy: 'cache-and-network'
  })
  const {
    data: statsData,
    loading: statsLoading,
    refetch: refetchStats
  } = useQuery<SavedJobStatsQueryResult>(SAVED_JOB_STATS_QUERY, {
    fetchPolicy: 'cache-and-network'
  })

  const [updateStatus] = useMutation(UPDATE_STATUS_MUTATION)
  const [setInterviewDate] = useMutation(SET_INTERVIEW_DATE_MUTATION)
  const [addTag] = useMutation(ADD_TAG_MUTATION)
  const [removeTag] = useMutation(REMOVE_TAG_MUTATION)
  const [unsaveJob] = useMutation(UNSAVE_JOB_MUTATION)

  const pageItems = data?.savedJobs.items ?? []
  const total = data?.savedJobs.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const stats = statsData?.savedJobStats

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value)
    setPage(1)
  }

  async function handleStatusChange(jobId: string, newStatus: ApplicationStatus) {
    setPendingField(jobId, 'status', true)
    try {
      await updateStatus({ variables: { jobId, status: newStatus } })
      // The mutation's own response already updates this row's status everywhere it's
      // cached (Apollo normalizes by SavedJob.id) - an unfiltered view just reflects the
      // new value in place. A status filter is the one case a list refetch still earns
      // its keep: the row may no longer belong in the current filtered page at all, and
      // only the server knows what should replace it.
      await Promise.all([
        statusFilter === ALL_FILTER_VALUE ? Promise.resolve() : refetch(),
        refetchStats()
      ])
      toast.success(`Status updated to ${APPLICATION_STATUS_LABELS[newStatus]}`)
    } catch (error) {
      toast.error('Could not update status', {
        description: error instanceof Error ? error.message : undefined
      })
    } finally {
      setPendingField(jobId, 'status', false)
    }
  }

  async function handleInterviewDateChange(jobId: string, interviewDate: string) {
    setPendingField(jobId, 'interviewDate', true)
    try {
      await setInterviewDate({ variables: { jobId, interviewDate: interviewDate || null } })
      // interviewDate never changes which page or status filter a row belongs in - the
      // mutation's own response already updates this row via Apollo's normalized cache.
      // Only the (cheap, non-scoring) stats row needs a fresh read.
      await refetchStats()
      toast.success(interviewDate ? 'Interview date saved' : 'Interview date cleared')
    } catch (error) {
      toast.error('Could not update interview date', {
        description: error instanceof Error ? error.message : undefined
      })
    } finally {
      setPendingField(jobId, 'interviewDate', false)
    }
  }

  async function handleAddTag(jobId: string, tag: string) {
    try {
      // Tags never affect list membership, page, or the stats row - the mutation's own
      // response already updates this row via Apollo's normalized cache, so no follow-up
      // network call is needed at all.
      await addTag({ variables: { jobId, tag } })
      toast.success(`Tag "${tag}" added`)
    } catch (error) {
      toast.error('Could not add tag', {
        description: error instanceof Error ? error.message : undefined
      })
    }
  }

  async function handleRemoveTag(jobId: string, tag: string) {
    setPendingField(jobId, 'removingTag', tag)
    try {
      await removeTag({ variables: { jobId, tag } })
      toast.success(`Tag "${tag}" removed`)
    } catch (error) {
      toast.error('Could not remove tag', {
        description: error instanceof Error ? error.message : undefined
      })
    } finally {
      setPendingField(jobId, 'removingTag', null)
    }
  }

  async function handleUnsave(jobId: string) {
    setPendingField(jobId, 'unsave', true)
    try {
      // Unlike the field edits above, this changes list membership and total count - a
      // point cache update can't safely express "and the next row from the following page
      // now belongs here instead" without asking the server, so this one keeps the refetch.
      await unsaveJob({ variables: { jobId } })
      await Promise.all([refetch(), refetchStats()])
      toast.success('Removed from your applications')
    } catch (unsaveError) {
      toast.error('Could not remove this job', {
        description: unsaveError instanceof Error ? unsaveError.message : undefined
      })
    } finally {
      setPendingField(jobId, 'unsave', false)
    }
  }

  return (
    <div>
      <PageHeader title="Applications" description="Track every saved job through your application process." />

      {(loading && !data) || (statsLoading && !statsData) ? (
        <ApplicationsSkeleton />
      ) : error ? (
        <ErrorMessage>Could not load applications: {error.message}</ErrorMessage>
      ) : !stats || stats.total === 0 ? (
        <p className="text-sm text-muted-foreground">
          No saved jobs yet. Save a job from your matches to start tracking its status here.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <ApplicationStatsRow stats={stats} />

          <div className="flex items-center justify-between gap-3">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All statuses</SelectItem>
                {STATUS_ORDER.map((statusOption) => (
                  <SelectItem key={statusOption} value={statusOption}>
                    {APPLICATION_STATUS_LABELS[statusOption]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {total} application{total === 1 ? '' : 's'}
            </p>
          </div>

          {pageItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No applications with this status.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {pageItems.map((savedJob) => {
                  const pending = getPending(savedJob.job.id)
                  return (
                    <ApplicationCard
                      key={savedJob.id}
                      savedJob={savedJob}
                      onStatusChange={handleStatusChange}
                      onInterviewDateChange={handleInterviewDateChange}
                      onAddTag={handleAddTag}
                      onRemoveTag={handleRemoveTag}
                      onUnsave={handleUnsave}
                      onViewInsight={setInsightTarget}
                      isStatusPending={pending.status}
                      isInterviewDatePending={pending.interviewDate}
                      removingTag={pending.removingTag}
                      isUnsavePending={pending.unsave}
                    />
                  )
                })}
              </div>

              <PaginationControls page={page} pageCount={pageCount} onChange={setPage} />
            </>
          )}
        </div>
      )}

      {insightTarget ? (
        <ApplicationInsightDialog
          open={Boolean(insightTarget)}
          onOpenChange={(open) => {
            if (!open) setInsightTarget(null)
          }}
          savedJob={insightTarget}
        />
      ) : null}
    </div>
  )
}
