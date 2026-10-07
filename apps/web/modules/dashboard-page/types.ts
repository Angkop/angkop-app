import type { JobMatch } from '@angkop/shared'

export type JobMatchesPage = {
  items: JobMatch[]
  total: number
  strongMatchCount: number
}

export type JobMatchesQueryResult = {
  jobMatches: JobMatchesPage
}
