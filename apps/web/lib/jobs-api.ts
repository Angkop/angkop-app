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

const EMPTY_PAGE: ListingsPageResponse = { items: [], total: 0, page: 1, pageSize: 0 }

export async function getListings(params: GetListingsParams = {}): Promise<ListingsPageResponse> {
  const search = new URLSearchParams()
  if (params.page) search.set('page', String(params.page))
  if (params.pageSize) search.set('pageSize', String(params.pageSize))
  if (params.q) search.set('q', params.q)
  if (params.source) search.set('source', params.source)
  if (params.skill) search.set('skill', params.skill)

  const response = await fetch(`${API_URL}/api/jobs?${search.toString()}`, { cache: 'no-store' })
  if (!response.ok) return EMPTY_PAGE
  return response.json()
}

export async function getListingSources(): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/jobs/sources`, { cache: 'no-store' })
  if (!response.ok) return []
  return response.json()
}

export async function getListingSkills(): Promise<string[]> {
  const response = await fetch(`${API_URL}/api/jobs/skills`, { cache: 'no-store' })
  if (!response.ok) return []
  return response.json()
}
