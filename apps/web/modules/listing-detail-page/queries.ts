import { API_URL } from '@/constants/api'
import type { ListingDetail } from './types'

export async function getListing(jobId: string): Promise<ListingDetail | null> {
  const response = await fetch(`${API_URL}/api/jobs/${jobId}`, { cache: 'no-store' })
  if (!response.ok) return null
  return response.json()
}
