import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { detectMentionedLanguages } from '../lib/language-detection'

export const jobsRouter = Router()

const DEFAULT_PAGE_SIZE = 12
const MAX_PAGE_SIZE = 50

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

// Distinct source names for the listings page's source filter — queried rather than
// hardcoded so a newly ingested source (see ingest-jobs.ts) shows up with no frontend change.
jobsRouter.get('/sources', async (_req, res) => {
  const rows = await prisma.job.findMany({
    where: { platform: 'angkop', deleted: false, sourceName: { not: null } },
    select: { sourceName: true },
    distinct: ['sourceName']
  })
  const sources = rows
    .map((row) => row.sourceName)
    .filter((sourceName): sourceName is string => sourceName !== null)
    .sort()
  res.json(sources)
})

// Distinct required-skill tags across every ingested listing, for the skill filter on
// /listings and /matches. Jobs don't have a normalized Skill table (unlike UserSkill), so
// this flattens the String[] column rather than joining one.
jobsRouter.get('/skills', async (_req, res) => {
  const rows = await prisma.job.findMany({
    where: { platform: 'angkop', deleted: false, sourceName: { not: null } },
    select: { requiredSkills: true }
  })
  const skills = Array.from(new Set(rows.flatMap((row) => row.requiredSkills))).sort()
  res.json(skills)
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
    workSetup: job.workSetup,
    employmentType: job.employmentType,
    detectedLanguage: job.detectedLanguage,
    mentionedLanguages: detectMentionedLanguages(job.description)
  })
})
