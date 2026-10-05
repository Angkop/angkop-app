import { gql } from '@apollo/client'

export const SAVED_JOBS_STATUS_QUERY = gql`
  query SavedJobsStatus {
    savedJobs {
      id
      status
    }
  }
`
