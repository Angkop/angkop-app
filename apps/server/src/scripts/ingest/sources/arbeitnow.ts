import type { EmploymentType, WorkSetup } from '@prisma/client'
import { logger } from '../../../lib/logger'
import { EMPLOYMENT_TYPE_MAP, JOBS_PER_SOURCE, MAX_ARBEITNOW_PAGES, USER_AGENT } from '../constants'
import { buildDescriptionSections, flattenSections } from '../description-sections'
import { fetchWithTimeout } from '../http'
import type { SourceFetchResult } from '../types'

function mapEmploymentType(jobTypes: unknown): EmploymentType | null {
  if (!Array.isArray(jobTypes)) return null
  for (const jobType of jobTypes) {
    if (typeof jobType !== 'string') continue
    const mapped = EMPLOYMENT_TYPE_MAP[jobType.trim().toLowerCase()]
    if (mapped) return mapped
  }
  return null
}

type ArbeitnowPage = {
  data?: Array<Record<string, unknown>>
  links?: { next?: string | null }
}

async function fetchArbeitnowPage(url: string): Promise<ArbeitnowPage | null> {
  try {
    const response = await fetchWithTimeout(url, { headers: { 'User-Agent': USER_AGENT } })
    if (response.ok) return (await response.json()) as ArbeitnowPage
    logger.warn({ status: response.status, url }, 'Arbeitnow page fetch failed, stopping pagination')
  } catch (error) {
    logger.warn({ error, url }, 'Arbeitnow page fetch errored, stopping pagination')
  }
  return null
}

export async function fetchArbeitnow(): Promise<SourceFetchResult> {
  const rawJobs: Record<string, unknown>[] = []
  let nextUrl: string | null = 'https://arbeitnow.com/api/job-board-api'

  // The first page failing means nothing was read, which is a failed source. A later page
  // failing just means the feed was only partly read, which `complete` reports.
  const firstPage = await fetchArbeitnowPage(nextUrl)
  if (!firstPage) throw new Error('Arbeitnow first page could not be fetched')
  rawJobs.push(...(firstPage.data ?? []))
  nextUrl = firstPage.links?.next ?? null

  for (let page = 1; page < MAX_ARBEITNOW_PAGES && nextUrl && rawJobs.length < JOBS_PER_SOURCE; page++) {
    const body: ArbeitnowPage | null = await fetchArbeitnowPage(nextUrl)
    if (!body) break
    rawJobs.push(...(body.data ?? []))
    nextUrl = body.links?.next ?? null
  }

  // Complete only if the API ran out of pages by itself, not because a cap or a failure
  // stopped the walk — otherwise a job missing from `rawJobs` may just be on a page we never read.
  const complete = nextUrl === null && rawJobs.length <= JOBS_PER_SOURCE
  // Stopped because JOBS_PER_SOURCE was reached with pages still left, as opposed to a page
  // failing partway, which leaves us under the limit.
  const capped = nextUrl !== null && rawJobs.length >= JOBS_PER_SOURCE

  const listings = rawJobs
    .filter((entry): entry is Record<string, unknown> & { slug: string; title: string } =>
      typeof entry.slug === 'string' && typeof entry.title === 'string'
    )
    .slice(0, JOBS_PER_SOURCE)
    .map((job) => {
      const descriptionSections = buildDescriptionSections(typeof job.description === 'string' ? job.description : '')
      return {
        id: `angkop-arbeitnow-${job.slug}`,
        title: job.title,
        company: typeof job.company_name === 'string' ? job.company_name : 'Unknown Company',
        description: flattenSections(descriptionSections),
        descriptionSections,
        requiredSkills: Array.isArray(job.tags) ? (job.tags as unknown[]).filter((t): t is string => typeof t === 'string').slice(0, 8) : [],
        sourceName: 'Arbeitnow',
        sourceUrl: typeof job.url === 'string' ? job.url : `https://arbeitnow.com/jobs/${job.slug}`,
        location: typeof job.location === 'string' && job.location.trim() ? job.location.trim() : null,
        // Arbeitnow's API has no salary field at all.
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        salaryPeriod: null,
        workSetup: typeof job.remote === 'boolean' ? (job.remote ? ('REMOTE' as WorkSetup) : ('ONSITE' as WorkSetup)) : null,
        employmentType: mapEmploymentType(job.job_types)
      }
    })

  return { listings, complete, capped }
}
