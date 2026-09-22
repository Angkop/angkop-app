import { Router } from 'express'
import { prisma } from '../lib/prisma'

export const jobsRouter = Router()

// Public and unauthenticated on purpose: these back the /listings pages in apps/web, which
// the browser extension scrapes the same way it scrapes a real job platform. Only jobs
// ingested from a real job API (sourceName set) are exposed here — hand-written seed/demo
// jobs keep using the static apps/web/public/demo page instead.
jobsRouter.get('/', async (_req, res) => {
  const jobs = await prisma.job.findMany({
    where: { platform: 'demo', deleted: false, sourceName: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      platformJobId: true,
      title: true,
      company: true,
      requiredSkills: true,
      sourceName: true
    }
  })
  res.json(jobs)
})

jobsRouter.get('/:id', async (req, res) => {
  const job = await prisma.job.findFirst({
    where: { id: req.params.id, platform: 'demo', deleted: false, sourceName: { not: null } }
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
    requiredSkills: job.requiredSkills,
    sourceName: job.sourceName,
    sourceUrl: job.sourceUrl
  })
})
