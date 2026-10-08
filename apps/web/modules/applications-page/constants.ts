import type { ApplicationStatus } from '@angkop/shared'

export const STATUS_ORDER: ApplicationStatus[] = [
  'PENDING',
  'APPLIED',
  'AWAITING_INTERVIEW',
  'ONGOING_INTERVIEW',
  'INTERVIEWED',
  'SUCCESSFUL',
  'UNSUCCESSFUL'
]

export const PAGE_SIZE = 10
