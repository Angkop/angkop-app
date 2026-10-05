import type { UserProfile as SharedUserProfile } from '@angkop/shared'

export type MeProfile = Omit<SharedUserProfile, 'id' | 'userId' | 'skillsText'>

export type MeQueryResult = {
  me: { email: string; name: string | null; profile: MeProfile | null }
}
