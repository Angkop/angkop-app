import type { CareerLevel } from '@prisma/client'

// Best-effort only: neither RemoteOK nor Arbeitnow expose a structured experience-level
// field, so this scans free-text description for explicit seniority wording. Checked in
// this order because a posting can mention multiple levels in passing (e.g. a "senior"
// team member in the "about us" blurb) — the most specific, least ambiguous phrasing wins.
// Falls back to a plain "X years" pattern only when no seniority word matched at all.
// Returns null rather than guessing when nothing matches.
const LEVEL_PATTERNS: { level: CareerLevel; pattern: RegExp }[] = [
  { level: 'MANAGER', pattern: /\b(manager|head of|director)\b/i },
  { level: 'LEAD', pattern: /\b(lead|principal|staff)\b/i },
  { level: 'SENIOR', pattern: /\bsenior\b/i },
  {
    level: 'ENTRY_LEVEL',
    pattern: /\b(entry[- ]level|fresh graduate|new grad|no experience (necessary|required)|recent graduate)\b/i
  },
  { level: 'JUNIOR', pattern: /\bjunior\b/i },
  { level: 'MID_LEVEL', pattern: /\b(mid[- ]level|intermediate)\b/i }
]

const YEARS_RANGES: { level: CareerLevel; pattern: RegExp }[] = [
  { level: 'ENTRY_LEVEL', pattern: /\b(0|1)\+?\s*(?:-\s*\d+\s*)?years?\b/i },
  { level: 'JUNIOR', pattern: /\b([1-3])\+?\s*(?:-\s*\d+\s*)?years?\b/i },
  { level: 'MID_LEVEL', pattern: /\b([3-5])\+?\s*(?:-\s*\d+\s*)?years?\b/i },
  { level: 'SENIOR', pattern: /\b([5-8])\+?\s*(?:-\s*\d+\s*)?years?\b/i },
  { level: 'LEAD', pattern: /\b([89]|1\d)\+?\s*(?:-\s*\d+\s*)?years?\b/i }
]

export function detectExperienceLevel(text: string): CareerLevel | null {
  for (const { level, pattern } of LEVEL_PATTERNS) {
    if (pattern.test(text)) return level
  }
  for (const { level, pattern } of YEARS_RANGES) {
    if (pattern.test(text)) return level
  }
  return null
}
