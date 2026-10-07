import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string | null, email: string) {
  const source = name?.trim() || email
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

// Applies a patch of filter/page changes to the current URL's search params as a query
// string — undefined/empty values are removed instead of written, so a cleared filter
// drops out of the URL rather than persisting as an empty param.
export function withSearchParams(
  current: URLSearchParams,
  patch: Record<string, string | number | undefined>
): string {
  const next = new URLSearchParams(current.toString())
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === '') next.delete(key)
    else next.set(key, String(value))
  }
  return next.toString()
}
