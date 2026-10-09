import { gql } from '@apollo/client'
import type { JobMatch } from '@angkop/shared'

export const JOB_MATCHES_QUERY = gql`
  query JobMatches($page: Int, $pageSize: Int, $search: String, $skill: String) {
    jobMatches(page: $page, pageSize: $pageSize, search: $search, skill: $skill) {
      items {
        hybridScore
        semanticScore
        collaborativeScore
        job {
          id
          title
          company
          description
          platform
          requiredSkills
          url
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

export type JobMatchesPage = {
  items: JobMatch[]
  total: number
  strongMatchCount: number
}

export type JobMatchesQueryResult = {
  jobMatches: JobMatchesPage
}
