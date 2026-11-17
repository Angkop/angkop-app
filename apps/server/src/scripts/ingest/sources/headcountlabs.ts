import { logger } from '../../../lib/logger'
import {
  HEADCOUNTLABS_MAX_JOBS,
  HEADCOUNTLABS_PAGE_SIZE,
  HEADCOUNTLABS_REQUEST_INTERVAL_MS,
  HEADCOUNTLABS_WORK_SETUP_MAP,
  USER_AGENT
} from '../constants'
import { flattenSections, parseDescriptionSections } from '../description-sections'
import type { NormalizedListing } from '../types'

const API_URL = 'https://api.headcountlabs.com/v1/jobs'

type HeadcountLabsPage = {
  data?: Array<Record<string, unknown>>
  next_cursor?: string | null
}

// Most fields come wrapped as { state, value }. Only 'known' and 'derived' carry a value —
// 'source_omitted', 'source_unmapped' and 'extraction_failed' mean "missing", not "empty".
function unwrap(field: unknown): unknown {
  if (typeof field !== 'object' || field === null) return undefined
  const { state, value } = field as { state?: unknown; value?: unknown }
  return state === 'known' || state === 'derived' ? value : undefined
}

function unwrapString(field: unknown): string | null {
  const value = unwrap(field)
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

// A job can list many locations (one sample had 16, with a US one first even though we query
// country=PH), so the Philippine entry wins and the first usable one is the fallback.
// `region` is skipped on purpose — it comes back as "Philippines (the)".
function formatLocation(locations: unknown): string | null {
  if (!Array.isArray(locations)) return null
  const formatted: Array<{ text: string; country: unknown }> = []
  for (const entry of locations) {
    const value = unwrap(entry)
    if (typeof value !== 'object' || value === null) continue
    const { city, country } = value as { city?: unknown; country?: unknown }
    const parts = [city, country].filter((part): part is string => typeof part === 'string' && part.trim() !== '')
    if (parts.length > 0) formatted.push({ text: parts.join(', '), country })
  }
  return (formatted.find((location) => location.country === 'PH') ?? formatted[0])?.text ?? null
}

// The link back to the employer's own posting. A listing without one is dropped, since the
// link back is what keeps us on the right side of the source's terms.
function findPostingUrl(postings: unknown): string | null {
  if (!Array.isArray(postings)) return null
  for (const posting of postings) {
    if (typeof posting !== 'object' || posting === null) continue
    const url = unwrapString((posting as { posting_url?: unknown }).posting_url)
    if (url) return url
  }
  return null
}

// Descriptions arrive as plain text with newlines, but parseDescriptionSections reads HTML.
function textToHtml(text: string): string {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
    .join('')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchHeadcountLabs(): Promise<NormalizedListing[]> {
  const apiKey = process.env.HEADCOUNTLABS_API_KEY
  if (!apiKey) {
    logger.warn('HEADCOUNTLABS_API_KEY is not set, skipping Headcount Labs')
    return []
  }

  const rawJobs: Record<string, unknown>[] = []
  let cursor: string | null = null

  while (rawJobs.length < HEADCOUNTLABS_MAX_JOBS) {
    const params = new URLSearchParams({ country: 'PH', limit: String(HEADCOUNTLABS_PAGE_SIZE) })
    if (cursor) params.set('cursor', cursor)

    const response = await fetch(`${API_URL}?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'User-Agent': USER_AGENT }
    })
    if (!response.ok) {
      logger.warn(
        { status: response.status, retryAfter: response.headers.get('retry-after') },
        'Headcount Labs fetch failed, stopping pagination'
      )
      break
    }
    logger.info(
      { recordsRemaining: response.headers.get('x-data-records-remaining') },
      'Headcount Labs page fetched'
    )

    const body: HeadcountLabsPage = (await response.json()) as HeadcountLabsPage
    rawJobs.push(...(body.data ?? []))
    cursor = body.next_cursor ?? null
    if (!cursor) break
    await sleep(HEADCOUNTLABS_REQUEST_INTERVAL_MS)
  }

  const listings: NormalizedListing[] = []
  for (const job of rawJobs.slice(0, HEADCOUNTLABS_MAX_JOBS)) {
    const title = unwrapString(job.title)
    const description = unwrapString(job.description)
    const sourceUrl = findPostingUrl(job.postings)
    if (typeof job.job_id !== 'string' || !title || !description || !sourceUrl) continue

    const descriptionSections = parseDescriptionSections(textToHtml(description))
    const workArrangement = unwrapString(job.work_arrangement)
    listings.push({
      id: `angkop-headcountlabs-${job.job_id}`,
      title,
      company: unwrapString(job.employer_name) ?? 'Unknown Company',
      description: flattenSections(descriptionSections),
      descriptionSections,
      // No skill tags in this API; withSkillFallback detects them from the description.
      requiredSkills: [],
      sourceName: 'Headcount Labs',
      sourceUrl,
      location: formatLocation(job.locations),
      // `pay` came back as `extraction_failed` in every job probed so far and its populated
      // shape hasn't been seen yet, so salary stays null rather than guessing at it.
      salaryMin: null,
      salaryMax: null,
      workSetup: workArrangement ? (HEADCOUNTLABS_WORK_SETUP_MAP[workArrangement] ?? null) : null,
      // The API has no employment-type field.
      employmentType: null
    })
  }
  return listings
}
