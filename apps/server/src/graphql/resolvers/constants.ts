import type { ApplicationStatus, InteractionEventType } from '@angkop/shared'

export const VALID_EVENT_TYPES: InteractionEventType[] = ['view', 'save', 'apply', 'dismiss']
export const DEFAULT_JOB_MATCHES_PAGE_SIZE = 20
export const MAX_JOB_MATCHES_PAGE_SIZE = 50
export const DEFAULT_SKILL_GAPS_PAGE_SIZE = 10
export const MAX_SKILL_GAPS_PAGE_SIZE = 50
export const DEFAULT_SAVED_JOBS_PAGE_SIZE = 10
export const MAX_SAVED_JOBS_PAGE_SIZE = 50
// Mirrors apps/web's application-stats-row.tsx IN_PROGRESS_STATUSES — kept here too since
// savedJobStats computes the same breakdown server-side.
export const IN_PROGRESS_SAVED_JOB_STATUSES: ApplicationStatus[] = [
  'APPLIED',
  'AWAITING_INTERVIEW',
  'ONGOING_INTERVIEW',
  'INTERVIEWED'
]
// The ML service serializes its actual model calls (see ml/app/services/embedder.py), so
// firing more requests at once than that just makes them queue on the Express side instead
// — this keeps a request from timing out while waiting behind a big backlog.
export const ML_REQUEST_CONCURRENCY = 3
