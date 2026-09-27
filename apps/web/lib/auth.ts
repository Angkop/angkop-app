import { API_URL } from '@/constants/api'

const TOKEN_STORAGE_KEY = 'angkop_session_token'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function storeToken(token: string): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export async function devLogin(): Promise<string> {
  const response = await fetch(`${API_URL}/auth/dev-login`, { method: 'POST' })
  if (!response.ok) {
    throw new Error('Dev login failed — is the Express API running and seeded?')
  }
  const data = (await response.json()) as { token: string }
  storeToken(data.token)
  return data.token
}
