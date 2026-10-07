import 'dotenv/config'
import * as cheerio from 'cheerio'
import type { DescriptionSection } from '@angkop/shared'
import { PrismaClient, type EmploymentType, type WorkSetup } from '@prisma/client'
import { logger } from '../lib/logger'

const prisma = new PrismaClient()
const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000'
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000'
const JOBS_PER_SOURCE = 50
const MAX_DESCRIPTION_LENGTH = 1500

// Real public job-board APIs, no key required. We ingest into our own DB and re-serve the
// listings on apps/web's /listings pages (platform: 'demo') for the extension to scrape —
// see ARCHITECTURE.md for why: scraping our own site carries no third-party ToS risk, while
// these APIs' own terms (link back to the original posting) are satisfied via sourceUrl.
const USER_AGENT = 'Angkop-Thesis-Project/0.1 (educational use; github.com/angkop)'

// Maps Arbeitnow's free-text job_types to our EmploymentType enum (the same enum
// UserPreference.preferredJobTypes uses) so the two sides can be compared directly.
// Unrecognized values stay null rather than being guessed at.
const EMPLOYMENT_TYPE_MAP: Record<string, EmploymentType> = {
  'full-time': 'FULL_TIME',
  'full time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  'part time': 'PART_TIME',
  contract: 'CONTRACT',
  contractor: 'CONTRACT',
  internship: 'INTERNSHIP',
  intern: 'INTERNSHIP',
  freelance: 'FREELANCE'
}

// franc (ISO 639-3) -> a display name, only for languages worth labeling on the detail
// page. Unrecognized/unlisted codes stay null rather than surfacing a raw ISO code.
const LANGUAGE_NAMES: Record<string, string> = {
  deu: 'German',
  fra: 'French',
  spa: 'Spanish',
  ita: 'Italian',
  nld: 'Dutch',
  por: 'Portuguese',
  pol: 'Polish',
  rus: 'Russian',
  ukr: 'Ukrainian',
  cmn: 'Chinese',
  jpn: 'Japanese',
  kor: 'Korean',
  vie: 'Vietnamese',
  tha: 'Thai',
  hin: 'Hindi',
  arb: 'Arabic',
  heb: 'Hebrew',
  tur: 'Turkish',
  ell: 'Greek',
  swe: 'Swedish',
  nob: 'Norwegian',
  dan: 'Danish',
  fin: 'Finnish',
  ces: 'Czech',
  ron: 'Romanian',
  hun: 'Hungarian',
  tgl: 'Tagalog'
}

type NormalizedListing = {
  id: string
  title: string
  company: string
  description: string
  descriptionSections: DescriptionSection[]
  requiredSkills: string[]
  sourceName: string
  sourceUrl: string
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  workSetup: WorkSetup | null
  employmentType: EmploymentType | null
}

// Splits a description's HTML into sections by its own headings, instead of flattening
// everything into one paragraph. These sources use two different heading styles — real
// <h1-h6> tags (Arbeitnow sometimes), and a <p> whose entire content is one bolded phrase
// (both sources, e.g. "<p><strong>Requirements</strong></p>") — both are treated as a new
// section's heading; everything else (paragraphs, list items) becomes an item in whichever
// section is currently open. Content before the first heading has heading: null.
function parseDescriptionSections(html: string): DescriptionSection[] {
  const $ = cheerio.load(html)
  const sections: DescriptionSection[] = [{ heading: null, items: [] }]
  const current = () => sections[sections.length - 1]

  function isPseudoHeading(element: ReturnType<typeof $>): string | null {
    const children = element.children()
    if (children.length !== 1) return null
    const onlyChild = children.first()
    if (!onlyChild.is('strong, b')) return null
    const fullText = element.text().trim()
    const childText = onlyChild.text().trim()
    return fullText && fullText === childText ? fullText : null
  }

  $('body')
    .children()
    .each((_, element) => {
      const $element = $(element)
      const tag = element.type === 'tag' ? element.name : ''

      if (/^h[1-6]$/.test(tag)) {
        const heading = $element.text().trim()
        if (heading) sections.push({ heading, items: [] })
        return
      }

      if (tag === 'p') {
        const pseudoHeading = isPseudoHeading($element)
        if (pseudoHeading) {
          sections.push({ heading: pseudoHeading, items: [] })
          return
        }
        const text = $element.text().trim()
        if (text) current().items.push(text)
        return
      }

      if (tag === 'ul' || tag === 'ol') {
        $element.find('li').each((_li, li) => {
          const text = $(li).text().trim()
          if (text) current().items.push(text)
        })
        return
      }

      const text = $element.text().trim()
      if (text) current().items.push(text)
    })

  return sections.filter((section) => section.items.length > 0)
}

function flattenSections(sections: DescriptionSection[]): string {
  return sections
    .flatMap((section) => (section.heading ? [section.heading, ...section.items] : section.items))
    .join('. ')
    .slice(0, MAX_DESCRIPTION_LENGTH)
}

// franc-min is ESM-only; this package is CommonJS, so it's loaded via dynamic import
// rather than a static one (tsc rejects a static import of an ESM package — TS1479).
// franc needs real sentence-length text to be confident; a short/ambiguous result ('und')
// is treated the same as English — i.e. no language notice shown — since guessing wrong
// here would be more misleading than saying nothing.
async function detectLanguage(text: string): Promise<string | null> {
  const { franc } = await import('franc-min')
  const code = franc(text, { minLength: 20 })
  return LANGUAGE_NAMES[code] ?? null
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

function mapEmploymentType(jobTypes: unknown): EmploymentType | null {
  if (!Array.isArray(jobTypes)) return null
  for (const jobType of jobTypes) {
    if (typeof jobType !== 'string') continue
    const mapped = EMPLOYMENT_TYPE_MAP[jobType.trim().toLowerCase()]
    if (mapped) return mapped
  }
  return null
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
    const [embedding, detectedLanguage] = await Promise.all([
      embed(`${listing.title}. ${listing.description}`),
      detectLanguage(listing.description)
    ])
    const fields = {
      title: listing.title,
      company: listing.company,
      description: listing.description,
      detectedLanguage,
      requiredSkills: listing.requiredSkills,
      url: `${WEB_URL}/listings/${listing.id}`,
      sourceName: listing.sourceName,
      sourceUrl: listing.sourceUrl,
      location: listing.location,
      salaryMin: listing.salaryMin,
      salaryMax: listing.salaryMax,
      workSetup: listing.workSetup,
      employmentType: listing.employmentType,
      embedding
    }
    await prisma.job.upsert({
      where: { platform_platformJobId: { platform: 'demo', platformJobId: listing.id } },
      update: fields,
      create: {
        id: listing.id,
        platformJobId: listing.id,
        platform: 'demo',
        ...fields
      }
    })

    // Upsert each section by its position, so a re-ingest of the same listing updates
    // existing rows in place instead of duplicating them. If this run has fewer sections
    // than exist in the DB (the source trimmed content), the extra trailing ones are
    // stale — soft-deleted rather than hard-deleted, same as everywhere else in this schema.
    // Sequential, not Promise.all: Supabase's pooler caps concurrent connections at 15,
    // and a burst of per-section upserts across many listings blew past that.
    for (const [order, section] of listing.descriptionSections.entries()) {
      await prisma.jobDescriptionSection.upsert({
        where: { jobId_order: { jobId: listing.id, order } },
        update: { heading: section.heading, items: section.items, deleted: false },
        create: { jobId: listing.id, order, heading: section.heading, items: section.items }
      })
    }
    await prisma.jobDescriptionSection.updateMany({
      where: { jobId: listing.id, order: { gte: listing.descriptionSections.length }, deleted: false },
      data: { deleted: true }
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
