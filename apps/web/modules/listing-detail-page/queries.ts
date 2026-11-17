import { API_URL } from '@/constants/api'
import type { ListingDetail } from './types'

export async function getListing(jobId: string): Promise<ListingDetail | null> {
  const response = await fetch(`${API_URL}/api/jobs/${jobId}`, { cache: 'no-store' })
  // Only a missing listing is a 404. Any other failure throws to the error boundary rather
  // than telling the user a listing that exists is gone.
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Listing request failed (${response.status})`)
  return response.json()
}
