import { gql } from '@apollo/client'

export const SKILL_GAPS_QUERY = gql`
  query SkillGaps($page: Int, $pageSize: Int) {
    skillGaps(page: $page, pageSize: $pageSize) {
      items {
        skill
        confidence
        courses {
          title
          provider
          url
          thumbnail
          description
        }
      }
      total
    }
    savedJobCount
  }
`
