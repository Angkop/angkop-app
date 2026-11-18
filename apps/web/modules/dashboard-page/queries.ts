import { gql } from '@apollo/client'

// Separate from lib/job-matches' JOB_MATCHES_QUERY on purpose: the fit map needs
// missingSkillCount, and the other match lists shouldn't pay for a field they don't show.
export const DASHBOARD_MATCHES_QUERY = gql`
  query DashboardMatches($pageSize: Int) {
    jobMatches(page: 1, pageSize: $pageSize) {
      items {
        hybridScore
        missingSkillCount
        job {
          id
          title
          company
          requiredSkills
          sourceName
        }
      }
      total
      strongMatchCount
    }
  }
`

export const DASHBOARD_PIPELINE_QUERY = gql`
  query DashboardPipeline {
    savedJobStats {
      total
      statusCounts {
        status
        count
      }
    }
  }
`

export const DASHBOARD_GAPS_QUERY = gql`
  query DashboardGaps($pageSize: Int) {
    skillGaps(page: 1, pageSize: $pageSize) {
      items {
        skill
        confidence
        courses {
          title
          provider
          url
        }
      }
      total
    }
    savedJobCount
  }
`
