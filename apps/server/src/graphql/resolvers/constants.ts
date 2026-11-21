import type { ApplicationStatus, InteractionEventType } from '@angkop/shared'

export const VALID_EVENT_TYPES: InteractionEventType[] = ['view', 'save', 'apply', 'dismiss']
export const DEFAULT_JOB_MATCHES_PAGE_SIZE = 20
export const MAX_JOB_MATCHES_PAGE_SIZE = 50
export const DEFAULT_SKILL_GAPS_PAGE_SIZE = 10
export const MAX_SKILL_GAPS_PAGE_SIZE = 50
export const DEFAULT_SAVED_JOBS_PAGE_SIZE = 10
export const MAX_SAVED_JOBS_PAGE_SIZE = 50
// The Job columns a saved job's response reads. Leaves out `embedding`: 384 floats per row (about
// 6x the rest of the row) that nothing built from a saved job uses, so `include: { job: true }`
// was shipping them from Postgres on every saved-jobs page and every saved-job mutation.
export const SAVED_JOB_JOB_SELECT = {
  id: true,
  platformJobId: true,
  platform: true,
  title: true,
  company: true,
  description: true,
  requiredSkills: true,
  url: true,
  sourceName: true
} as const
// Mirrors apps/web's application-stats-row.tsx IN_PROGRESS_STATUSES — kept here too since
// savedJobStats computes the same breakdown server-side.
export const IN_PROGRESS_SAVED_JOB_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'AWAITING_INTERVIEW',
  'ONGOING_INTERVIEW',
  'INTERVIEWED'
]
