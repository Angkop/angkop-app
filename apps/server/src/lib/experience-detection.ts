import type { CareerLevel } from '@prisma/client'

// Best-effort only: none of the sources expose a structured experience-level field, so this
// reads the title and the description for explicit wording about the *candidate*. Bare words
// like "manager", "lead" or "staff" anywhere in the description are deliberately ignored —
// "report to the manager", "lead generation" and "our staff" say nothing about the level of
// the role. Returns null rather than guessing when nothing explicit is found.

// The title is the most reliable signal, checked in this order because a title can carry two
// words ("Senior Engineering Manager") and the more specific, higher level should win.
const TITLE_PATTERNS: { level: CareerLevel; pattern: RegExp }[] = [
  { level: 'STUDENT', pattern: /\b(intern|internship|trainee|apprentice(ship)?|ojt)\b/i },
  { level: 'MANAGER', pattern: /\b(manager|director|head of|vp|vice president|chief)\b/i },
  {
    level: 'LEAD',
    pattern:
      /\b(team lead|tech(nical)? lead|lead (engineer|developer|designer|analyst|architect|programmer|scientist|recruiter)|principal|staff (engineer|software|developer|designer|data|product|scientist))\b/i
  },
  { level: 'SENIOR', pattern: /\b(senior|sr)\b\.?/i },
  { level: 'JUNIOR', pattern: /\b(junior|jr)\b\.?/i },
  { level: 'ENTRY_LEVEL', pattern: /\b(entry[- ]level|graduate|fresher|fresh grad)\b/i },
  { level: 'MID_LEVEL', pattern: /\b(mid[- ]level|intermediate)\b/i }
]

const ENTRY_LEVEL_PHRASES =
  /\b(entry[- ]level|fresh graduates?|new grads?|recent graduates?|no (prior )?experience (is )?(necessary|required|needed)|0\s*(?:-|–|to)\s*1 years?)\b/i

// "5+ years of (relevant/professional/...) experience", "3-5 years experience", "1 year of
// customer service experience" — up to four words may sit between "years" and "experience".
const YEARS_OF_EXPERIENCE =
  /(\d{1,2})\s*\+?\s*(?:(?:-|–|to)\s*\d{1,2}\s*\+?\s*)?years?(?:['’]s)?(?:\s+(?:of|in|with))?(?:\s+[\w/&-]+){0,4}?\s+(?:experience|exp)\b/gi

// "looking for a senior ...", "senior-level".
const SENIORITY_PHRASES: { level: CareerLevel; pattern: RegExp }[] = [
  { level: 'SENIOR', pattern: /\b(?:(?:looking for|seeking|hiring|need|require)s?\s+(?:an?\s+)?(?:\w+\s+){0,2}?senior|senior[- ]level)\b/i },
  { level: 'JUNIOR', pattern: /\b(?:(?:looking for|seeking|hiring|need|require)s?\s+(?:an?\s+)?(?:\w+\s+)?junior|junior[- ]level)\b/i },
  { level: 'MID_LEVEL', pattern: /\bmid[- ]level\b/i }
]

function levelForYears(years: number): CareerLevel {
  if (years <= 1) return 'ENTRY_LEVEL'
  if (years === 2) return 'JUNIOR'
  if (years <= 4) return 'MID_LEVEL'
  if (years <= 7) return 'SENIOR'
  return 'LEAD'
}

export function detectExperienceLevel(text: string, title = ''): CareerLevel | null {
  const fromTitle = TITLE_PATTERNS.find(({ pattern }) => pattern.test(title))
  if (fromTitle) return fromTitle.level

  if (ENTRY_LEVEL_PHRASES.test(text)) return 'ENTRY_LEVEL'

  // A posting often mentions years more than once ("a company with 10 years of experience
  // in the market" next to "3 years of experience required"), so the smallest figure is the
  // one most likely to be the candidate's.
  const years = [...text.matchAll(YEARS_OF_EXPERIENCE)].map((match) => Number(match[1]))
  if (years.length > 0) return levelForYears(Math.min(...years))

  return SENIORITY_PHRASES.find(({ pattern }) => pattern.test(text))?.level ?? null
}
