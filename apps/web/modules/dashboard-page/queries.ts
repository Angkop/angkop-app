import { gql } from '@apollo/client'

export const JOB_MATCHES_QUERY = gql`
  query JobMatches($page: Int, $pageSize: Int, $search: String) {
    jobMatches(page: $page, pageSize: $pageSize, search: $search) {
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
