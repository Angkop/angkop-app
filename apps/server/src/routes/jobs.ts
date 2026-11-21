import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { detectMentionedLanguages } from '../lib/language-detection'
import { pickSkills } from '../lib/skill-search'
import { createTtlCache } from '../lib/ttl-cache'
import { joinSections } from '../scripts/ingest/description-sections'

export const jobsRouter = Router()

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 50
const DEFAULT_SKILL_LIMIT = 10
const MAX_SKILL_LIMIT = 50

function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : NaN
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

// Public and unauthenticated on purpose: these back the /listings pages in apps/web, which
// the browser extension scrapes the same way it scrapes a real job platform. Only jobs
// ingested from a real job API (sourceName set) are exposed here — hand-written seed/demo
// jobs keep using the static apps/web/public/demo page instead.
jobsRouter.get('/', async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1, Number.MAX_SAFE_INTEGER)
  const pageSize = parsePositiveInt(req.query.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  const source = typeof req.query.source === 'string' ? req.query.source.trim() : ''
  const skill = typeof req.query.skill === 'string' ? req.query.skill.trim() : ''

  const where: Prisma.JobWhereInput = {
    platform: 'angkop',
    deleted: false,
    sourceName: source || { not: null },
    ...(skill ? { requiredSkills: { has: skill } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } }
          ]
        }
      : {})
  }

  const [items, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        platformJobId: true,
        title: true,
        company: true,
        requiredSkills: true,
        sourceName: true
      }
    }),
    prisma.job.count({ where })
  ])

  res.json({ items, total, page, pageSize })
})

// The filter dropdowns' options only change when the nightly ingest runs, so each is read from
// Postgres at most once every few minutes per process instead of on every page load. The /matches
// page asks for the skills straight from the browser, where Next's own fetch cache does not apply.
const FILTER_OPTIONS_TTL_MS = 5 * 60 * 1000

// Distinct source names for the listings page's source filter — queried rather than
// hardcoded so a newly ingested source (see ingest-jobs.ts) shows up with no frontend change.
const getSources = createTtlCache(async () => {
  const rows = await prisma.job.findMany({
    where: { platform: 'angkop', deleted: false, sourceName: { not: null } },
    select: { sourceName: true },
    distinct: ['sourceName']
  })
  return rows
    .map((row) => row.sourceName)
    .filter((sourceName): sourceName is string => sourceName !== null)
    .sort()
}, FILTER_OPTIONS_TTL_MS)

// Every distinct required-skill tag across the ingested listings, with how many listings ask for
// it, most-asked first. Jobs don't have a normalized Skill table (unlike UserSkill), so this
// flattens the String[] column rather than joining one. Postgres flattens and counts it, and the
// result (about 1,500 skills) is held in memory, so searching it on each keystroke is a loop over
// a small array, not a database query.
const getSkillCounts = createTtlCache(async () => {
  const rows = await prisma.$queryRaw<{ skill: string }[]>`
    SELECT skill
    FROM (
      SELECT id, unnest("requiredSkills") AS skill
      FROM "Job"
      WHERE platform = 'angkop' AND deleted = false AND "sourceName" IS NOT NULL
    ) AS listing_skills
    GROUP BY skill
    ORDER BY count(DISTINCT id) DESC, skill ASC
  `
  return rows.map((row) => row.skill)
}, FILTER_OPTIONS_TTL_MS)

jobsRouter.get('/sources', async (_req, res) => {
  res.json(await getSources())
})

// The skill filters on /listings and /matches. Never the whole list: the first `limit` skills
// (default 10, most-asked first), or the first `limit` whose name contains `q` when the user is
// searching the dropdown.
jobsRouter.get('/skills', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : ''
  const limit = parsePositiveInt(req.query.limit, DEFAULT_SKILL_LIMIT, MAX_SKILL_LIMIT)

  res.json(pickSkills(await getSkillCounts(), q, limit))
})

jobsRouter.get('/:id', async (req, res) => {
  const job = await prisma.job.findFirst({
    where: { id: req.params.id, platform: 'angkop', deleted: false, sourceName: { not: null } },
    include: {
      descriptionSections: {
        where: { deleted: false },
        orderBy: { order: 'asc' }
      }
    }
  })
  if (!job) {
    res.status(404).json({ error: `Unknown listing ${req.params.id}` })
    return
  }
  res.json({
    id: job.id,
    platformJobId: job.platformJobId,
    title: job.title,
    company: job.company,
    description: job.description,
    descriptionSections: job.descriptionSections.map((section) => ({
      heading: section.heading,
      items: section.items
    })),
    requiredSkills: job.requiredSkills,
    sourceName: job.sourceName,
    sourceUrl: job.sourceUrl,
    location: job.location,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryCurrency: job.salaryCurrency,
    salaryPeriod: job.salaryPeriod,
    workSetup: job.workSetup,
    employmentType: job.employmentType,
    detectedLanguage: job.detectedLanguage,
    experienceLevel: job.experienceLevel,
    // Scanned against the full, untruncated section text rather than job.description
    // (which is flattened and truncated to MAX_DESCRIPTION_LENGTH at ingest time) — a
    // language mention near the bottom of a long posting would otherwise be truncated
    // away before this regex ever saw it.
    mentionedLanguages: detectMentionedLanguages(joinSections(job.descriptionSections))
  })
})
