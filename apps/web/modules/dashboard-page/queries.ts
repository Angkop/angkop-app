import { gql } from '@apollo/client'

export const JOB_MATCHES_QUERY = gql`
  query JobMatches {
    jobMatches {
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
      }
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
