import { gql } from '@apollo/client'
import type { MatchInsight } from '@angkop/shared'

export const JOB_MATCH_INSIGHT_QUERY = gql`
  query JobMatchInsight($jobId: ID!) {
    jobMatchInsight(jobId: $jobId) {
      semanticScore
      collaborativeScore
      hybridScore
      requiredSkillsCount
      interactionCount
      collaborativeWeight
      skillsReason
      activityReason
      matchingSkills
      missingSkills
      explanation
    }
  }
`

export type JobMatchInsightQueryResult = { jobMatchInsight: MatchInsight }
