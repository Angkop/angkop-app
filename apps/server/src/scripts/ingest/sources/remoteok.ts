import type { WorkSetup } from '@prisma/client'
import { logger } from '../../../lib/logger'
import { JOBS_PER_SOURCE, USER_AGENT } from '../constants'
import { flattenSections, parseDescriptionSections } from '../description-sections'
import type { NormalizedListing } from '../types'

export async function fetchRemoteOk(): Promise<NormalizedListing[]> {
  const response = await fetch('https://remoteok.com/api', {
    headers: { 'User-Agent': USER_AGENT }
  })
  if (!response.ok) {
    logger.warn({ status: response.status }, 'RemoteOK fetch failed, skipping source')
    return []
  }
  const raw = (await response.json()) as Array<Record<string, unknown>>

  return raw
    .filter((entry): entry is Record<string, unknown> & { id: string; position: string } =>
      typeof entry.id === 'string' && typeof entry.position === 'string'
    )
    .slice(0, JOBS_PER_SOURCE)
    .map((job) => {
      const descriptionSections = parseDescriptionSections(typeof job.description === 'string' ? job.description : '')
      return {
        id: `angkop-remoteok-${job.id}`,
        title: job.position,
        company: typeof job.company === 'string' ? job.company : 'Unknown Company',
        description: flattenSections(descriptionSections),
        descriptionSections,
        requiredSkills: Array.isArray(job.tags) ? (job.tags as unknown[]).filter((t): t is string => typeof t === 'string').slice(0, 8) : [],
        sourceName: 'RemoteOK',
        sourceUrl: typeof job.url === 'string' ? job.url : `https://remoteok.com/remote-jobs/${job.id}`,
        location: typeof job.location === 'string' && job.location.trim() ? job.location.trim() : null,
        // RemoteOK reports 0 for "not disclosed", not an actual $0 salary.
        salaryMin: typeof job.salary_min === 'number' && job.salary_min > 0 ? job.salary_min : null,
        salaryMax: typeof job.salary_max === 'number' && job.salary_max > 0 ? job.salary_max : null,
        // Every RemoteOK listing is, by definition of the platform, a remote job.
        workSetup: 'REMOTE' as WorkSetup,
        // RemoteOK's API has no employment-type field.
        employmentType: null
      }
    })
}
