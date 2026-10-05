import { gql } from '@apollo/client'

export const HAS_PROFILE_QUERY = gql`
  query HasProfile {
    me {
      profile {
        id
      }
    }
  }
`
