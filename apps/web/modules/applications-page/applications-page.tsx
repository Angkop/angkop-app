'use client'

import { useMutation, useQuery } from '@apollo/client/react'
import type { ApplicationStatus, SavedJob } from '@angkop/shared'
import { PageHeader } from '@/components/page-header'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
import { SavedJobCard } from './components/saved-job-card'
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

  if (loading) return <LoadingSkeleton rows={3} heightClassName="h-28" />
  if (error) return <ErrorMessage>Could not load applications: {error.message}</ErrorMessage>

  const savedJobs = data?.savedJobs ?? []

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
    await unsaveJob({ variables: { jobId } })
    await refetch()
  }

  return (
    <div>
      <PageHeader title="Applications" description="Track every saved job through your application process." />

      {savedJobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No saved jobs yet. Save a job from your matches to start tracking its status here.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {savedJobs.map((savedJob) => (
            <SavedJobCard
              key={savedJob.id}
              savedJob={savedJob}
              onStatusChange={handleStatusChange}
              onInterviewDateChange={handleInterviewDateChange}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              onUnsave={handleUnsave}
            />
          ))}
        </div>
      )}
    </div>
  )
}
