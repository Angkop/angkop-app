import { gql } from '@apollo/client'
import type { Job } from '@angkop/shared'

export const JOB_MATCHES_QUERY = gql`
  query JobMatches($page: Int, $pageSize: Int, $search: String, $skill: String) {
    jobMatches(page: $page, pageSize: $pageSize, search: $search, skill: $skill) {
      items {
        hybridScore
        job {
          id
          title
          company
          description
          requiredSkills
          sourceName
        }
      }
      total
      strongMatchCount
    }
  }
`

export const LOG_INTERACTION_MUTATION = gql`
  mutation LogInteraction($jobId: ID!, $eventType: String!) {
    logInteraction(jobId: $jobId, eventType: $eventType)
  }
`

export const SAVE_JOB_MUTATION = gql`
  mutation SaveJob($jobId: ID!) {
    saveJob(jobId: $jobId) {
      id
    }
  }
`

export const SAVED_JOB_IDS_QUERY = gql`
  query SavedJobIds {
    savedJobIds
  }
`

export type SavedJobIdsQueryResult = {
  savedJobIds: string[]
}

// What the list views read from jobMatches: the score and enough of the job to render a row.
// The description is only there to cut a one-line summary from; the component scores, url and
// platform are fetched on demand.
export type JobMatchSummary = {
  hybridScore: number
  job: Pick<Job, 'id' | 'title' | 'company' | 'description' | 'requiredSkills' | 'sourceName'>
}

export type JobMatchesPage = {
  items: JobMatchSummary[]
  total: number
  strongMatchCount: number
}

export type JobMatchesQueryResult = {
  jobMatches: JobMatchesPage
}
