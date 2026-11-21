// Reuses one loaded value for `ttlMs`, and lets callers that arrive while it is loading share the
// same load instead of each starting their own.
export function createTtlCache<T>(load: () => Promise<T>, ttlMs: number, now: () => number = Date.now) {
  let cached: { value: T; expiresAt: number } | null = null
  let inFlight: Promise<T> | null = null

  return async function get(): Promise<T> {
    if (cached && cached.expiresAt > now()) return cached.value
    if (!inFlight) {
      inFlight = load()
        .then((value) => {
          cached = { value, expiresAt: now() + ttlMs }
          return value
        })
        .finally(() => {
          inFlight = null
        })
    }
    return inFlight
  }
}
