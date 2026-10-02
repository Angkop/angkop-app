'use client'

import { gql } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import { Calendar, X } from 'lucide-react'
import { APPLICATION_STATUS_LABELS, type ApplicationStatus, type SavedJob } from '@angkop/shared'
import { Button } from '@/components/ui/button'
import { ChipList } from '@/components/chip-list'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/page-header'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'

const STATUS_ORDER: ApplicationStatus[] = [
  'PENDING',
  'APPLIED',
  'AWAITING_INTERVIEW',
  'ONGOING_INTERVIEW',
  'INTERVIEWED',
  'SUCCESSFUL',
  'UNSUCCESSFUL'
]

const SAVED_JOBS_QUERY = gql`
  query SavedJobs {
    savedJobs {
      id
      status
      tags
      interviewDate
      job {
        id
        title
        company
      }
    }
  }
`

const UPDATE_STATUS_MUTATION = gql`
  mutation UpdateSavedJobStatus($jobId: ID!, $status: ApplicationStatus!) {
    updateSavedJobStatus(jobId: $jobId, status: $status) {
      id
    }
  }
`

const SET_INTERVIEW_DATE_MUTATION = gql`
  mutation SetSavedJobInterviewDate($jobId: ID!, $interviewDate: String) {
    setSavedJobInterviewDate(jobId: $jobId, interviewDate: $interviewDate) {
      id
    }
  }
`

const ADD_TAG_MUTATION = gql`
  mutation AddSavedJobTag($jobId: ID!, $tag: String!) {
    addSavedJobTag(jobId: $jobId, tag: $tag) {
      id
    }
  }
`

const REMOVE_TAG_MUTATION = gql`
  mutation RemoveSavedJobTag($jobId: ID!, $tag: String!) {
    removeSavedJobTag(jobId: $jobId, tag: $tag) {
      id
    }
  }
`

const UNSAVE_JOB_MUTATION = gql`
  mutation UnsaveJob($jobId: ID!) {
    unsaveJob(jobId: $jobId)
  }
`

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
            <div key={savedJob.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{savedJob.job.title}</p>
                  <p className="text-xs text-muted-foreground">{savedJob.job.company}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Unsave job"
                  onClick={() => handleUnsave(savedJob.job.id)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Select
                  value={savedJob.status}
                  onValueChange={(value) => handleStatusChange(savedJob.job.id, value as ApplicationStatus)}
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
                    onChange={(event) => handleInterviewDateChange(savedJob.job.id, event.target.value)}
                    className="h-8 w-36 text-xs"
                  />
                </div>
              </div>

              <div className="mt-3">
                <ChipList
                  items={savedJob.tags}
                  onAdd={(tag) => handleAddTag(savedJob.job.id, tag)}
                  onRemove={(tag) => handleRemoveTag(savedJob.job.id, tag)}
                  placeholder="e.g. Dream job"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
