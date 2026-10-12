import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { INTERACTION_WEIGHTS, type InteractionEventType, type Platform } from '@angkop/shared'
import { prisma } from '../lib/prisma'
import { invalidateMatchScoresForUser } from '../lib/redis'
import { embed } from '../lib/ml-client'
import { logger } from '../lib/logger'

const DEMO_USER_ID = 'demo-user-1'
const VALID_EVENT_TYPES: InteractionEventType[] = ['view', 'save', 'apply', 'dismiss']

type EventPayload = {
  userId?: string
  eventType: InteractionEventType
  job: {
    platformJobId: string
    platform: Platform
    title: string
    company: string
    description: string
    url: string
    requiredSkills?: string[]
  }
}

export const eventsRouter = Router()

// Trusts a client-supplied userId instead of requiring a session — the browser extension
// runs independently of the dashboard's Google sign-in. Fine for a local MVP; would need
// to move behind real auth (Chrome Identity API, per CLAUDE.md) before handling untrusted traffic.
eventsRouter.post('/', async (req, res) => {
  const body = req.body as Partial<EventPayload>

  if (!body.eventType || !VALID_EVENT_TYPES.includes(body.eventType)) {
    res.status(400).json({ error: `eventType must be one of ${VALID_EVENT_TYPES.join(', ')}` })
    return
  }
  if (!body.job?.platformJobId || !body.job.platform || !body.job.title) {
    res.status(400).json({ error: 'job.platformJobId, job.platform, and job.title are required' })
    return
  }

  const userId = body.userId ?? DEMO_USER_ID
  // Independent reads/writes - the job upsert's input is entirely body.job.*, never the
  // user lookup's result, so there's no data dependency between them. The one behavior
  // change: an unrecognized userId now still upserts the job before the 404 below, instead
  // of short-circuiting first. Harmless here - Job is a shared catalog row, not user-owned
  // data, and would need to exist regardless of which user's event triggered it.
  const [user, job] = await Promise.all([
    prisma.user.findFirst({ where: { id: userId, deleted: false } }),
    prisma.job.upsert({
      where: {
        platform_platformJobId: {
          platform: body.job.platform,
          platformJobId: body.job.platformJobId
        }
      },
      update: {},
      create: {
        id: randomUUID(),
        platformJobId: body.job.platformJobId,
        platform: body.job.platform,
        title: body.job.title,
        company: body.job.company ?? 'Unknown Company',
        description: body.job.description ?? '',
        requiredSkills: body.job.requiredSkills ?? [],
        url: body.job.url,
        embedding: []
      }
    })
  ])

  if (!user) {
    res.status(404).json({ error: `Unknown userId ${userId}` })
    return
  }

  // A job the upsert above just created (not already ingested - this route is a defensive
  // fallback, since the extension is only supposed to see jobs Angkop already ingested) has
  // no embedding yet. Unlike UserProfile.embedding, nothing downstream resolves a missing
  // Job.embedding to a neutral vector - cosine_similarity would throw on a length mismatch
  // the first time it's scored. Backfill it once, here, before it's ever read for scoring.
  let scorableJob = job
  if (job.embedding.length === 0) {
    const { embedding } = await embed({ text: `${job.title}. ${job.description}` })
    scorableJob = await prisma.job.update({ where: { id: job.id }, data: { embedding } })
  }

  const interaction = await prisma.interaction.create({
    data: {
      userId,
      jobId: scorableJob.id,
      eventType: body.eventType,
      weight: INTERACTION_WEIGHTS[body.eventType],
      platform: body.job.platform
    }
  })

  // Interaction count feeds the collaborative/semantic blend weight for every job, not
  // just this one — see the same invalidation in the logInteraction GraphQL resolver.
  await invalidateMatchScoresForUser(userId)

  logger.info({ userId, jobId: scorableJob.id, eventType: body.eventType }, 'Interaction logged')
  res.status(201).json({ interactionId: interaction.id, jobId: scorableJob.id })
})
