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

export function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER_VALUE)
  const [page, setPage] = useState(1)
  const [insightTarget, setInsightTarget] = useState<SavedJob | null>(null)

  const status = statusFilter === ALL_FILTER_VALUE ? undefined : (statusFilter as ApplicationStatus)

  const { data, loading, error, refetch } = useQuery<SavedJobsQueryResult>(SAVED_JOBS_QUERY, {
    variables: { page, pageSize: PAGE_SIZE, status }
  })
  const {
    data: statsData,
    loading: statsLoading,
    refetch: refetchStats
  } = useQuery<SavedJobStatsQueryResult>(SAVED_JOB_STATS_QUERY)

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
    try {
      await updateStatus({ variables: { jobId, status: newStatus } })
      await Promise.all([refetch(), refetchStats()])
      toast.success(`Status updated to ${APPLICATION_STATUS_LABELS[newStatus]}`)
    } catch (error) {
      toast.error('Could not update status', {
        description: error instanceof Error ? error.message : undefined
      })
    }
  }

  async function handleInterviewDateChange(jobId: string, interviewDate: string) {
    try {
      await setInterviewDate({ variables: { jobId, interviewDate: interviewDate || null } })
      await Promise.all([refetch(), refetchStats()])
      toast.success(interviewDate ? 'Interview date saved' : 'Interview date cleared')
    } catch (error) {
      toast.error('Could not update interview date', {
        description: error instanceof Error ? error.message : undefined
      })
    }
  }

  async function handleAddTag(jobId: string, tag: string) {
    try {
      await addTag({ variables: { jobId, tag } })
      await refetch()
      toast.success(`Tag "${tag}" added`)
    } catch (error) {
      toast.error('Could not add tag', {
        description: error instanceof Error ? error.message : undefined
      })
    }
  }

  async function handleRemoveTag(jobId: string, tag: string) {
    try {
      await removeTag({ variables: { jobId, tag } })
      await refetch()
      toast.success(`Tag "${tag}" removed`)
    } catch (error) {
      toast.error('Could not remove tag', {
        description: error instanceof Error ? error.message : undefined
      })
    }
  }

  async function handleUnsave(jobId: string) {
    try {
      await unsaveJob({ variables: { jobId } })
      await Promise.all([refetch(), refetchStats()])
      toast.success('Removed from your applications')
    } catch (unsaveError) {
      toast.error('Could not remove this job', {
        description: unsaveError instanceof Error ? unsaveError.message : undefined
      })
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
                {pageItems.map((savedJob) => (
                  <ApplicationCard
                    key={savedJob.id}
                    savedJob={savedJob}
                    onStatusChange={handleStatusChange}
                    onInterviewDateChange={handleInterviewDateChange}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                    onUnsave={handleUnsave}
                    onViewInsight={setInsightTarget}
                  />
                ))}
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
