export type Platform = 'demo' | 'jobstreet' | 'indeed' | 'linkedin' | 'kalibrr' | 'philjobnet' | 'glassdoor'

export type InteractionEventType = 'view' | 'save' | 'apply' | 'dismiss'

export const INTERACTION_WEIGHTS: Record<InteractionEventType, number> = {
  apply: 5,
  save: 3,
  view: 1,
  dismiss: -2
}

export type MatchLabel = 'Strong Match' | 'Partial Match' | 'Weak Match'

export const MATCH_SCORE_THRESHOLDS = {
  STRONG: 0.7,
  PARTIAL: 0.4
} as const

export function getMatchLabel(score: number): MatchLabel {
  if (score >= MATCH_SCORE_THRESHOLDS.STRONG) return 'Strong Match'
  if (score >= MATCH_SCORE_THRESHOLDS.PARTIAL) return 'Partial Match'
  return 'Weak Match'
}

export type Education = {
  school: string
  degree: string
  year: number
}

export type WorkExperience = {
  title: string
  company: string
  months: number
}

export type UserProfile = {
  id: string
  userId: string
  skills: string[]
  skillsText: string
  desiredRole: string | null
  location: string | null
  education: Education[]
  experience: WorkExperience[]
}

export type Job = {
  id: string
  platformJobId: string
  platform: Platform
  title: string
  company: string
  description: string
  requiredSkills: string[]
  url: string
  sourceName?: string | null
  sourceUrl?: string | null
}

export type JobMatch = {
  job: Job
  semanticScore: number
  collaborativeScore: number
  hybridScore: number
}

export type SkillGap = {
  skill: string
  confidence: number
  courses: Course[]
}

export type Course = {
  title: string
  provider: string
  url: string
}

export type EmbedRequest = {
  text: string
}

export type EmbedResponse = {
  embedding: number[]
}

export type RecommendRequest = {
  userId: string
  jobId: string
  userSkillsText: string
  jobText: string
  userInteractionCount: number
}

export type RecommendResponse = {
  semanticScore: number
  collaborativeScore: number
  hybridScore: number
}

export type SkillGapRequest = {
  userSkills: string[]
  jobRequiredSkills: string[]
}

export type SkillGapResponse = {
  missingSkills: SkillGap[]
}
