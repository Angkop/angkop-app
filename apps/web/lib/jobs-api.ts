import { API_URL } from '@/constants/api'

export type ListingSummary = {
  id: string
  title: string
  company: string
  requiredSkills: string[]
  sourceName: string
}

export type ListingsPageResponse = {
  items: ListingSummary[]
  total: number
  page: number
  pageSize: number
}

export type GetListingsParams = {
  page?: number
  pageSize?: number
  q?: string
  source?: string
  skill?: string
}

export async function getListings(params: GetListingsParams = {}): Promise<ListingsPageResponse> {
  const search = new URLSearchParams()
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  if (params.q) search.set('q', params.q)
  if (params.source) search.set('source', params.source)
  if (params.skill) search.set('skill', params.skill)

  // Listings only change when the nightly ingest runs, so a minute-old page is as good as a live
  // one - and every visitor asking for the same page shares one API call instead of each paying
  // for their own (no-store meant none of it could ever be reused).
  const response = await fetch(`${API_URL}/api/jobs?${search.toString()}`, { next: { revalidate: 60 } })
  // Throw instead of returning an empty page: a server error must not look like "no jobs
  // match", it should reach the route's error boundary with a way to reload.
  if (!response.ok) throw new Error(`Listings request failed (${response.status})`)
  return response.json()
}

// The set of sources/skills across all ingested jobs barely changes between ingestion
// runs - no-store meant every visitor re-fetched this from scratch on every page load.
// A 5-minute window is long enough to cut that down to one fetch per filter-dropdown
// population per revalidation period, short enough that a new source/skill shows up soon
// after the next ingestion run, not hours later.
export async function getListingSources(): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/jobs/sources`, { next: { revalidate: 300 } })
  if (!response.ok) return []
  return response.json()
}

export type GetListingSkillsParams = {
  // Only skills whose name contains this text.
  q?: string
  // How many to return. The server answers with the most-asked skills first and never with all
  // of them (about 1,500), so a dropdown shows a few and searches for the rest.
  limit?: number
  signal?: AbortSignal
}

export async function getListingSkills(params: GetListingSkillsParams = {}): Promise<string[]> {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.limit) search.set('limit', String(params.limit))

  const response = await fetch(`${API_URL}/api/jobs/skills?${search.toString()}`, {
    next: { revalidate: 300 },
    signal: params.signal
  })
  if (!response.ok) return []
  return response.json()
}
