import { API_URL } from '@/constants/api'
import type { ListingSummary } from './types'

export async function getListings(): Promise<ListingSummary[]> {
  const response = await fetch(`${API_URL}/api/jobs`, { cache: 'no-store' })
  if (!response.ok) return []
  return response.json()
}
