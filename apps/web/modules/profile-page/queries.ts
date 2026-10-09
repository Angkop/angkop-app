import { gql } from '@apollo/client'

export const APPLIED_JOB_COUNT_QUERY = gql`
  query AppliedJobCount {
    appliedJobCount
  }
`
