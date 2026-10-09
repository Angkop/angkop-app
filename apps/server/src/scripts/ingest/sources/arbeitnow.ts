import type { EmploymentType, WorkSetup } from '@prisma/client'
import { logger } from '../../../lib/logger'
import { EMPLOYMENT_TYPE_MAP, JOBS_PER_SOURCE, MAX_ARBEITNOW_PAGES, USER_AGENT } from '../constants'
import { flattenSections, parseDescriptionSections } from '../description-sections'
import type { NormalizedListing } from '../types'

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
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) {
    logger.warn({ status: response.status, url }, 'Arbeitnow page fetch failed, stopping pagination')
    return null
  }
  return (await response.json()) as ArbeitnowPage
}

export async function fetchArbeitnow(): Promise<NormalizedListing[]> {
  const rawJobs: Record<string, unknown>[] = []
  let nextUrl: string | null = 'https://arbeitnow.com/api/job-board-api'

  for (let page = 0; page < MAX_ARBEITNOW_PAGES && nextUrl && rawJobs.length < JOBS_PER_SOURCE; page++) {
    const body: ArbeitnowPage | null = await fetchArbeitnowPage(nextUrl)
    if (!body) break
    rawJobs.push(...(body.data ?? []))
    nextUrl = body.links?.next ?? null
  }

  return rawJobs
    .filter((entry): entry is Record<string, unknown> & { slug: string; title: string } =>
      typeof entry.slug === 'string' && typeof entry.title === 'string'
    )
    .slice(0, JOBS_PER_SOURCE)
    .map((job) => {
      const descriptionSections = parseDescriptionSections(typeof job.description === 'string' ? job.description : '')
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
        workSetup: typeof job.remote === 'boolean' ? (job.remote ? ('REMOTE' as WorkSetup) : ('ONSITE' as WorkSetup)) : null,
        employmentType: mapEmploymentType(job.job_types)
      }
    })
}
