import { FETCH_TIMEOUT_MS } from './constants'

// A source that hangs would otherwise stall the whole run, so every request gets a deadline.
// The timeout surfaces as a thrown error, which the ingest reports as that one source failing.
export function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
}
