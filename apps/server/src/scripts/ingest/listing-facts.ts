import type { EmploymentType, SalaryPeriod, WorkSetup } from '@prisma/client'

// Fills the facts a source's API left empty by reading the posting's own words. Sources'
// structured values always win; these only run when the structured value is null, and they
// return null rather than guess.

const TITLE_EMPLOYMENT_PATTERNS: { type: EmploymentType; pattern: RegExp }[] = [
  { type: 'INTERNSHIP', pattern: /\bintern(ship)?\b/i },
  { type: 'PART_TIME', pattern: /\bpart[- ]time\b/i },
  { type: 'FREELANCE', pattern: /\bfreelanc(e|er)\b/i },
  { type: 'CONTRACT', pattern: /\bcontract(or)?\b/i },
  { type: 'FULL_TIME', pattern: /\bfull[- ]time\b/i }
]

// Stricter than the title patterns: a bare "contract" or "intern" in a description is as
// likely to be "employment contract" or "internal" as to describe this role. Order matters —
// an internship that mentions "full-time conversion" is still an internship.
const DESCRIPTION_EMPLOYMENT_PATTERNS: { type: EmploymentType; pattern: RegExp }[] = [
  { type: 'INTERNSHIP', pattern: /\b(internship (position|role|opportunity|program)|on[- ]the[- ]job training)\b/i },
  { type: 'PART_TIME', pattern: /\bpart[- ]time\b/i },
  { type: 'FREELANCE', pattern: /\bfreelanc(e|er)\b/i },
  {
    type: 'CONTRACT',
    pattern: /\b(contract (position|role|basis|job)|contract[- ]to[- ]hire|fixed[- ]term|contractor|temporary (position|role)|\d+[- ]months? contract)\b/i
  },
  { type: 'FULL_TIME', pattern: /\b(full[- ]time|permanent (position|role)|regular (employment|position))\b/i }
]

export function detectEmploymentType(title: string, text: string): EmploymentType | null {
  const fromTitle = TITLE_EMPLOYMENT_PATTERNS.find(({ pattern }) => pattern.test(title))
  if (fromTitle) return fromTitle.type
  return DESCRIPTION_EMPLOYMENT_PATTERNS.find(({ pattern }) => pattern.test(text))?.type ?? null
}

const HYBRID_PATTERN = /\bhybrid\b/i
const REMOTE_PATTERN = /\b(fully |100% |completely )?remote\b|work(ing)? from (home|anywhere)|\bwfh\b/i
const ONSITE_PATTERN = /\bon[- ]?site\b|in[- ]office|in the office|office[- ]based/i

export function detectWorkSetup(title: string, text: string): WorkSetup | null {
  const fromTitle = pickWorkSetup(title)
  return fromTitle ?? pickWorkSetup(text)
}

// Hybrid beats the other two (a hybrid role mentions both). Remote and onsite together are
// ambiguous — "remote-friendly, onsite in Manila twice a month" — so that stays null.
function pickWorkSetup(text: string): WorkSetup | null {
  if (HYBRID_PATTERN.test(text)) return 'HYBRID'
  const remote = REMOTE_PATTERN.test(text)
  const onsite = ONSITE_PATTERN.test(text)
  if (remote && onsite) return null
  if (remote) return 'REMOTE'
  if (onsite) return 'ONSITE'
  return null
}

export type ParsedSalary = {
  min: number | null
  max: number | null
  currency: string
  period: SalaryPeriod | null
}

const CURRENCY_MARKERS: { currency: string; marker: string }[] = [
  { currency: 'PHP', marker: '₱|php' },
  { currency: 'USD', marker: 'us\\$|usd|\\$' },
  { currency: 'EUR', marker: '€|eur' },
  { currency: 'GBP', marker: '£|gbp' },
  { currency: 'SGD', marker: 'sgd|s\\$' },
  { currency: 'AUD', marker: 'aud|a\\$' },
  { currency: 'CAD', marker: 'cad|c\\$' }
]
const MARKER_PATTERN = CURRENCY_MARKERS.map(({ marker }) => marker).join('|')
const AMOUNT = '(\\d{1,3}(?:,\\d{3})+|\\d+(?:\\.\\d+)?)\\s?(k(?![a-z]))?'
const RANGE_SEPARATOR = '\\s?(?:-|–|—|to)\\s?'

// "₱30,000 - ₱45,000" / "$80k to $100k"
const PREFIXED_SALARY = new RegExp(
  `(${MARKER_PATTERN})\\s?${AMOUNT}(?:${RANGE_SEPARATOR}(?:${MARKER_PATTERN})?\\s?${AMOUNT})?`,
  'gi'
)
// "30,000 - 45,000 PHP"
const SUFFIXED_SALARY = new RegExp(
  `${AMOUNT}(?:${RANGE_SEPARATOR}${AMOUNT})?\\s?(${MARKER_PATTERN})\\b`,
  'gi'
)

const SALARY_CONTEXT =
  /\b(salary|compensation|pay|paid|rate|wage|stipend|remuneration|earn|per (hour|day|month|year|annum)|monthly|annual(ly)?|hourly|daily|base|ote|range|offer(ing)?)\b|\/(hr|hour|mo|month|yr|year|day)\b/i
const NOT_A_SALARY_CONTEXT = /\b(funding|raised|series [a-e]|revenue|valuation|arr|investment|investors?)\b/i
const MAGNITUDE_SUFFIX = /^\s?(million|billion|m\b|bn\b|mm\b)/i
const CONTEXT_WINDOW = 100
const TAIL_LENGTH = 30

// Only phrases that actually describe pay frequency ("per month", "/hr", "monthly") — a bare
// "day" or "month" would match "from day one" or "13th month pay".
const PERIOD_PATTERNS: { period: SalaryPeriod; pattern: RegExp }[] = [
  { period: 'HOURLY', pattern: /(?:\b(?:per|an?) (?:hour|hr)\b|\/\s?(?:hr|hour)\b|\bhourly\b)/gi },
  { period: 'DAILY', pattern: /(?:\b(?:per|a) day\b|\/\s?day\b|\bdaily\b)/gi },
  { period: 'MONTHLY', pattern: /(?:\b(?:per|a) (?:month|mo)\b|\/\s?(?:mo|month)\b|\bmonthly\b)/gi },
  { period: 'YEARLY', pattern: /(?:\b(?:per|a) (?:year|yr|annum)\b|\/\s?(?:yr|year)\b|\bannual(?:ly)?\b|\byearly\b)/gi }
]

// Right after the amount wins ("₱30,000 per month"); otherwise whichever frequency phrase
// sits closest to it in the surrounding text, since a posting can mention several.
function detectPeriod(tail: string, before: string, after: string): SalaryPeriod | null {
  const fromTail = PERIOD_PATTERNS.find(({ pattern }) => new RegExp(pattern.source, 'i').test(tail))
  if (fromTail) return fromTail.period

  let closest: { period: SalaryPeriod; distance: number } | null = null
  for (const { period, pattern } of PERIOD_PATTERNS) {
    for (const match of before.matchAll(pattern)) {
      const distance = before.length - ((match.index ?? 0) + match[0].length)
      if (!closest || distance < closest.distance) closest = { period, distance }
    }
    for (const match of after.matchAll(pattern)) {
      const distance = match.index ?? 0
      if (!closest || distance < closest.distance) closest = { period, distance }
    }
  }
  return closest?.period ?? null
}

// When a posting never says how often the amount is paid, the figure itself sometimes does:
// ₱30,000 is a monthly wage in the Philippines, $90,000 is a yearly one. Anything in
// between stays null.
function inferPeriod(currency: string, amount: number): SalaryPeriod | null {
  if (currency === 'PHP') {
    if (amount >= 5_000 && amount <= 300_000) return 'MONTHLY'
    if (amount >= 1_000_000) return 'YEARLY'
    return null
  }
  return amount >= 20_000 && amount <= 1_000_000 ? 'YEARLY' : null
}

function toAmount(value: string, thousands: string | undefined): number {
  return Number(value.replace(/,/g, '')) * (thousands ? 1000 : 1)
}

function currencyForMarker(marker: string): string | null {
  const normalized = marker.toLowerCase()
  return (
    CURRENCY_MARKERS.find(({ marker: pattern }) => new RegExp(`^(?:${pattern})$`, 'i').test(normalized))
      ?.currency ?? null
  )
}

export function parseSalary(text: string): ParsedSalary | null {
  const candidates: { index: number; length: number; marker: string; first: string; firstK?: string; second?: string; secondK?: string }[] = []

  for (const match of text.matchAll(PREFIXED_SALARY)) {
    candidates.push({
      index: match.index ?? 0,
      length: match[0].length,
      marker: match[1],
      first: match[2],
      firstK: match[3],
      second: match[4],
      secondK: match[5]
    })
  }
  for (const match of text.matchAll(SUFFIXED_SALARY)) {
    candidates.push({
      index: match.index ?? 0,
      length: match[0].length,
      marker: match[5],
      first: match[1],
      firstK: match[2],
      second: match[3],
      secondK: match[4]
    })
  }
  candidates.sort((a, b) => a.index - b.index)

  for (const candidate of candidates) {
    const currency = currencyForMarker(candidate.marker)
    if (!currency) continue

    const end = candidate.index + candidate.length
    const before = text.slice(Math.max(0, candidate.index - CONTEXT_WINDOW), candidate.index)
    const after = text.slice(end, end + CONTEXT_WINDOW)
    const window = `${before}${text.slice(candidate.index, end)}${after}`
    const tail = text.slice(end, end + TAIL_LENGTH)
    if (MAGNITUDE_SUFFIX.test(tail) || NOT_A_SALARY_CONTEXT.test(window) || !SALARY_CONTEXT.test(window)) continue

    const first = toAmount(candidate.first, candidate.firstK)
    const second = candidate.second ? toAmount(candidate.second, candidate.secondK) : null
    const min = second === null ? first : Math.min(first, second)
    const max = second === null ? null : Math.max(first, second)

    const period = detectPeriod(tail, before, after) ?? inferPeriod(currency, max ?? min)
    const floor = period === 'HOURLY' ? 3 : 1_000
    if (min < floor) continue

    return { min, max: max ?? null, currency, period }
  }
  return null
}
