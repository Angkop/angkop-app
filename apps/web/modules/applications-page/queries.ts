import { gql } from '@apollo/client'

export const SAVED_JOBS_QUERY = gql`
  query SavedJobs($page: Int, $pageSize: Int, $status: ApplicationStatus) {
    savedJobs(page: $page, pageSize: $pageSize, status: $status) {
      items {
        id
        status
        tags
        interviewDate
        createdAt
        hybridScore
        job {
          id
          title
          company
          requiredSkills
          url
          sourceName
        }
      }
      total
    }
  }
`

export const SAVED_JOB_STATS_QUERY = gql`
  query SavedJobStats {
    savedJobStats {
      total
      inProgress
      upcomingInterviews
      successful
    }
  }
`

// Each mutation now selects the field it actually changed, not just id - Apollo's
// normalized cache (keyed by SavedJob.id) merges that field into every query currently
// showing this row automatically, so the applications-page no longer needs to refetch
// (and re-score) the whole list just to reflect one row's edit.
export const UPDATE_STATUS_MUTATION = gql`
  mutation UpdateSavedJobStatus($jobId: ID!, $status: ApplicationStatus!) {
    updateSavedJobStatus(jobId: $jobId, status: $status) {
      id
      status
    }
  }
`

export const SET_INTERVIEW_DATE_MUTATION = gql`
  mutation SetSavedJobInterviewDate($jobId: ID!, $interviewDate: String) {
    setSavedJobInterviewDate(jobId: $jobId, interviewDate: $interviewDate) {
      id
      interviewDate
    }
  }
`

export const ADD_TAG_MUTATION = gql`
  mutation AddSavedJobTag($jobId: ID!, $tag: String!) {
    addSavedJobTag(jobId: $jobId, tag: $tag) {
      id
      tags
    }
  }
`

export const REMOVE_TAG_MUTATION = gql`
  mutation RemoveSavedJobTag($jobId: ID!, $tag: String!) {
    removeSavedJobTag(jobId: $jobId, tag: $tag) {
      id
      tags
    }
  }
`

export const UNSAVE_JOB_MUTATION = gql`
  mutation UnsaveJob($jobId: ID!) {
    unsaveJob(jobId: $jobId)
  }
`
