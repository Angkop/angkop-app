import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger'

const prisma = new PrismaClient()
const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000'
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000'
const JOBS_PER_SOURCE = 50

// Real public job-board APIs, no key required. We ingest into our own DB and re-serve the
// listings on apps/web's /listings pages (platform: 'demo') for the extension to scrape —
// see ARCHITECTURE.md for why: scraping our own site carries no third-party ToS risk, while
// these APIs' own terms (link back to the original posting) are satisfied via sourceUrl.
const USER_AGENT = 'Angkop-Thesis-Project/0.1 (educational use; github.com/angkop)'

type NormalizedListing = {
  id: string
  title: string
  company: string
  description: string
  requiredSkills: string[]
  sourceName: string
  sourceUrl: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1500)
}

async function fetchRemoteOk(): Promise<NormalizedListing[]> {
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
    .map((job) => ({
      id: `angkop-remoteok-${job.id}`,
      title: job.position,
      company: typeof job.company === 'string' ? job.company : 'Unknown Company',
      description: stripHtml(typeof job.description === 'string' ? job.description : ''),
      requiredSkills: Array.isArray(job.tags) ? (job.tags as unknown[]).filter((t): t is string => typeof t === 'string').slice(0, 8) : [],
      sourceName: 'RemoteOK',
      sourceUrl: typeof job.url === 'string' ? job.url : `https://remoteok.com/remote-jobs/${job.id}`
    }))
}

async function fetchArbeitnow(): Promise<NormalizedListing[]> {
  const response = await fetch('https://arbeitnow.com/api/job-board-api', {
    headers: { 'User-Agent': USER_AGENT }
  })
  if (!response.ok) {
    logger.warn({ status: response.status }, 'Arbeitnow fetch failed, skipping source')
    return []
  }
  const body = (await response.json()) as { data?: Array<Record<string, unknown>> }

  return (body.data ?? [])
    .filter((entry): entry is Record<string, unknown> & { slug: string; title: string } =>
      typeof entry.slug === 'string' && typeof entry.title === 'string'
    )
    .slice(0, JOBS_PER_SOURCE)
    .map((job) => ({
      id: `angkop-arbeitnow-${job.slug}`,
      title: job.title,
      company: typeof job.company_name === 'string' ? job.company_name : 'Unknown Company',
      description: stripHtml(typeof job.description === 'string' ? job.description : ''),
      requiredSkills: Array.isArray(job.tags) ? (job.tags as unknown[]).filter((t): t is string => typeof t === 'string').slice(0, 8) : [],
      sourceName: 'Arbeitnow',
      sourceUrl: typeof job.url === 'string' ? job.url : `https://arbeitnow.com/jobs/${job.slug}`
    }))
}

async function embed(text: string): Promise<number[]> {
  const response = await fetch(`${ML_SERVICE_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  if (!response.ok) {
    throw new Error(
      `Failed to embed text via ${ML_SERVICE_URL}/embed (status ${response.status}). ` +
        'Is the ML service running? See ml/README for setup.'
    )
  }
  const data = (await response.json()) as { embedding: number[] }
  return data.embedding
}

async function main() {
  const [remoteOk, arbeitnow] = await Promise.all([fetchRemoteOk(), fetchArbeitnow()])
  const listings = [...remoteOk, ...arbeitnow]

  if (listings.length === 0) {
    logger.warn('No listings fetched from any source — nothing to ingest. Check network access.')
    return
  }

  logger.info(`Ingesting ${listings.length} real listings (${remoteOk.length} RemoteOK, ${arbeitnow.length} Arbeitnow)...`)

  for (const listing of listings) {
    const embedding = await embed(`${listing.title}. ${listing.description}`)
    await prisma.job.upsert({
      where: { platform_platformJobId: { platform: 'demo', platformJobId: listing.id } },
      update: {
        title: listing.title,
        company: listing.company,
        description: listing.description,
        requiredSkills: listing.requiredSkills,
        url: `${WEB_URL}/listings/${listing.id}`,
        sourceName: listing.sourceName,
        sourceUrl: listing.sourceUrl,
        embedding
      },
      create: {
        id: listing.id,
        platformJobId: listing.id,
        platform: 'demo',
        title: listing.title,
        company: listing.company,
        description: listing.description,
        requiredSkills: listing.requiredSkills,
        url: `${WEB_URL}/listings/${listing.id}`,
        sourceName: listing.sourceName,
        sourceUrl: listing.sourceUrl,
        embedding
      }
    })
  }

  logger.info('Ingest complete. Visit /listings on the dashboard to browse them.')
}

main()
  .catch((error) => {
    logger.error({ error }, 'Ingest failed')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
