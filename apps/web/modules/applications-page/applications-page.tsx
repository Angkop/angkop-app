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
  SET_INTERVIEW_DATE_MUTATION,
  UNSAVE_JOB_MUTATION,
  UPDATE_STATUS_MUTATION
} from './queries'

type SavedJobsQueryResult = {
  savedJobs: SavedJob[]
}

export function ApplicationsPage() {
  const { data, loading, error, refetch } = useQuery<SavedJobsQueryResult>(SAVED_JOBS_QUERY)
  const [updateStatus] = useMutation(UPDATE_STATUS_MUTATION)
  const [setInterviewDate] = useMutation(SET_INTERVIEW_DATE_MUTATION)
  const [addTag] = useMutation(ADD_TAG_MUTATION)
  const [removeTag] = useMutation(REMOVE_TAG_MUTATION)
  const [unsaveJob] = useMutation(UNSAVE_JOB_MUTATION)

  const [statusFilter, setStatusFilter] = useState<string>(ALL_FILTER_VALUE)
  const [page, setPage] = useState(1)
  const [insightTarget, setInsightTarget] = useState<SavedJob | null>(null)

  const savedJobs = data?.savedJobs ?? []
  const filteredJobs =
    statusFilter === ALL_FILTER_VALUE ? savedJobs : savedJobs.filter((savedJob) => savedJob.status === statusFilter)
  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filteredJobs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleStatusFilterChange(value: string) {
    setStatusFilter(value)
    setPage(1)
  }

  async function handleStatusChange(jobId: string, status: ApplicationStatus) {
    await updateStatus({ variables: { jobId, status } })
    await refetch()
  }

  async function handleInterviewDateChange(jobId: string, interviewDate: string) {
    await setInterviewDate({ variables: { jobId, interviewDate: interviewDate || null } })
    await refetch()
  }

  async function handleAddTag(jobId: string, tag: string) {
    await addTag({ variables: { jobId, tag } })
    await refetch()
  }

  async function handleRemoveTag(jobId: string, tag: string) {
    await removeTag({ variables: { jobId, tag } })
    await refetch()
  }

  async function handleUnsave(jobId: string) {
    try {
      await unsaveJob({ variables: { jobId } })
      await refetch()
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

      {loading ? (
        <ApplicationsSkeleton />
      ) : error ? (
        <ErrorMessage>Could not load applications: {error.message}</ErrorMessage>
      ) : savedJobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No saved jobs yet. Save a job from your matches to start tracking its status here.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <ApplicationStatsRow savedJobs={savedJobs} />

          <div className="flex items-center justify-between gap-3">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All statuses</SelectItem>
                {STATUS_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>
                    {APPLICATION_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {filteredJobs.length} application{filteredJobs.length === 1 ? '' : 's'}
            </p>
          </div>

          {filteredJobs.length === 0 ? (
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

              <PaginationControls page={currentPage} pageCount={pageCount} onChange={setPage} />
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
