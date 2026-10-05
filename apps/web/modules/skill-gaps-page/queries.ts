import { gql } from '@apollo/client'

export const SKILL_GAPS_QUERY = gql`
  query SkillGaps {
    skillGaps {
      skill
      confidence
      courses {
        title
        provider
        url
      }
    }
  }
`
