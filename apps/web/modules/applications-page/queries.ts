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

export const UPDATE_STATUS_MUTATION = gql`
  mutation UpdateSavedJobStatus($jobId: ID!, $status: ApplicationStatus!) {
    updateSavedJobStatus(jobId: $jobId, status: $status) {
      id
    }
  }
`

export const SET_INTERVIEW_DATE_MUTATION = gql`
  mutation SetSavedJobInterviewDate($jobId: ID!, $interviewDate: String) {
    setSavedJobInterviewDate(jobId: $jobId, interviewDate: $interviewDate) {
      id
    }
  }
`

export const ADD_TAG_MUTATION = gql`
  mutation AddSavedJobTag($jobId: ID!, $tag: String!) {
    addSavedJobTag(jobId: $jobId, tag: $tag) {
      id
    }
  }
`

export const REMOVE_TAG_MUTATION = gql`
  mutation RemoveSavedJobTag($jobId: ID!, $tag: String!) {
    removeSavedJobTag(jobId: $jobId, tag: $tag) {
      id
    }
  }
`

export const UNSAVE_JOB_MUTATION = gql`
  mutation UnsaveJob($jobId: ID!) {
    unsaveJob(jobId: $jobId)
  }
`
