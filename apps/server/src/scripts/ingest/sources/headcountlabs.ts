import { logger } from '../../../lib/logger'
import {
  HEADCOUNTLABS_ID_PREFIX,
  HEADCOUNTLABS_MAX_JOBS,
  HEADCOUNTLABS_PAGE_SIZE,
  HEADCOUNTLABS_REQUEST_INTERVAL_MS,
  HEADCOUNTLABS_WORK_SETUP_MAP,
  USER_AGENT
} from '../constants'
import { buildDescriptionSections, flattenSections, plainTextToHtml } from '../description-sections'
import { fetchWithTimeout } from '../http'
import type { NormalizedListing, SourceFetchResult } from '../types'

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchHeadcountLabs(): Promise<SourceFetchResult> {
  const apiKey = process.env.HEADCOUNTLABS_API_KEY
  if (!apiKey) throw new Error('HEADCOUNTLABS_API_KEY is not set')

  const rawJobs: Record<string, unknown>[] = []
  let cursor: string | null = null

  while (rawJobs.length < HEADCOUNTLABS_MAX_JOBS) {
    const params = new URLSearchParams({ country: 'PH', limit: String(HEADCOUNTLABS_PAGE_SIZE) })
    if (cursor) params.set('cursor', cursor)

    const response = await fetchWithTimeout(`${API_URL}?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'User-Agent': USER_AGENT }
    })
    if (!response.ok) {
      const failure = { status: response.status, retryAfter: response.headers.get('retry-after') }
      // Nothing read yet means the source failed; a later page failing keeps what we have.
      if (rawJobs.length === 0) throw new Error(`Headcount Labs responded with ${JSON.stringify(failure)}`)
      logger.warn(failure, 'Headcount Labs fetch failed, stopping pagination')
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

    const descriptionSections = buildDescriptionSections(plainTextToHtml(description))
    const workArrangement = unwrapString(job.work_arrangement)
    listings.push({
      id: `${HEADCOUNTLABS_ID_PREFIX}${job.job_id}`,
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
      salaryCurrency: null,
      salaryPeriod: null,
      workSetup: workArrangement ? (HEADCOUNTLABS_WORK_SETUP_MAP[workArrangement] ?? null) : null,
      // The API has no employment-type field.
      employmentType: null
    })
  }
  // Never "complete": Headcount Labs has tens of thousands of PH postings and we only read
  // the newest few hundred, so absence from this page says nothing. Whether a stored posting
  // is still live comes from checkHeadcountLabsJobs instead.
  return { listings, complete: false }
}

export type HeadcountLabsCheck = {
  // Ids that were actually looked up, so the caller can note when each was last checked.
  checked: string[]
  // Ids Headcount Labs says are gone.
  withdrawn: string[]
}

// Asks Headcount Labs whether each stored posting (our `angkop-headcountlabs-<id>` ids) is
// still available. GET /v1/jobs/{id} answers 410 job_withdrawn for a posting that has
// expired — and charges nothing for it — and 200 for a live one (one record, kept as small
// as possible by asking for the id alone). Their changes feed has no country filter, so it
// would mean reading every country's expiries; this reads only the postings we hold.
//
// Anything but a clear 200 or 410 leaves the posting alone: a 429 or a server error stops
// the pass (the rest are retried on a later night), and an unexpected status skips just that
// one. A flaky API can therefore never turn into a mass soft-delete.
export async function checkHeadcountLabsJobs(ids: string[]): Promise<HeadcountLabsCheck> {
  const apiKey = process.env.HEADCOUNTLABS_API_KEY
  if (!apiKey) throw new Error('HEADCOUNTLABS_API_KEY is not set')

  const checked: string[] = []
  const withdrawn: string[] = []

  for (const [index, id] of ids.entries()) {
    if (index > 0) await sleep(HEADCOUNTLABS_REQUEST_INTERVAL_MS)
    const sourceId = id.slice(HEADCOUNTLABS_ID_PREFIX.length)
    const response = await fetchWithTimeout(`${API_URL}/${encodeURIComponent(sourceId)}?fields=job_id`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'User-Agent': USER_AGENT }
    })

    if (response.status === 410) {
      checked.push(id)
      withdrawn.push(id)
    } else if (response.ok) {
      checked.push(id)
    } else if (response.status === 429 || response.status >= 500) {
      logger.warn(
        { status: response.status, retryAfter: response.headers.get('retry-after') },
        'Headcount Labs job check stopped early'
      )
      break
    } else {
      logger.warn({ status: response.status, id }, 'Headcount Labs job check returned an unexpected status, skipping it')
    }
  }
  logger.info(
    { requested: ids.length, checked: checked.length, withdrawn: withdrawn.length },
    'Headcount Labs job check done'
  )
  return { checked, withdrawn }
}
