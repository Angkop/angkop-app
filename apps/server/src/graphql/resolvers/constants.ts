import type { InteractionEventType } from '@angkop/shared'

export const VALID_EVENT_TYPES: InteractionEventType[] = ['view', 'save', 'apply', 'dismiss']
export const TOP_JOBS_FOR_SKILL_GAP = 3
export const DEFAULT_JOB_MATCHES_PAGE_SIZE = 20
export const MAX_JOB_MATCHES_PAGE_SIZE = 50
// The ML service serializes its actual model calls (see ml/app/services/embedder.py), so
// firing more requests at once than that just makes them queue on the Express side instead
// — this keeps a request from timing out while waiting behind a big backlog.
export const ML_REQUEST_CONCURRENCY = 3
