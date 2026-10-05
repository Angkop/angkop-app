import type { ApplicationStatus } from '@angkop/shared'

export type { MeProfile } from '@/hooks/use-profile-editor'

export type SavedJobsStatusQueryResult = {
  savedJobs: { id: number; status: ApplicationStatus }[]
}
