import type { ApplicationStatus, UserProfile as SharedUserProfile } from '@angkop/shared'

export type MeProfile = Omit<SharedUserProfile, 'id' | 'userId' | 'skillsText'>

export type MeQueryResult = {
  me: {
    id: string
    email: string
    name: string | null
    profile: MeProfile | null
  }
}

export type SavedJobsStatusQueryResult = {
  savedJobs: { id: number; status: ApplicationStatus }[]
}
