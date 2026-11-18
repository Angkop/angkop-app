import type { ApplicationStatus, Course, JobMatch, SkillGap } from '@angkop/shared'
import type { JobMatchSummary } from '@/lib/job-matches'

export type DashboardMatch = Pick<JobMatch, 'hybridScore' | 'missingSkillCount'> & {
  // The dashboard doesn't ask for the description.
  job: Omit<JobMatchSummary['job'], 'description'>
}

export type DashboardMatchesQueryResult = {
  jobMatches: {
    items: DashboardMatch[]
    total: number
    strongMatchCount: number
  }
}

export type PipelineStatusCount = { status: ApplicationStatus; count: number }

export type DashboardPipelineQueryResult = {
  savedJobStats: {
    total: number
    statusCounts: PipelineStatusCount[]
  }
}

export type DashboardGap = Pick<SkillGap, 'skill' | 'confidence'> & {
  courses: Pick<Course, 'title' | 'provider' | 'url'>[]
}

export type DashboardGapsQueryResult = {
  skillGaps: { items: DashboardGap[]; total: number }
  savedJobCount: number
}
