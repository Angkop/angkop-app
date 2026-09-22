import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { INTERACTION_WEIGHTS, type InteractionEventType, type Platform } from '@angkop/shared'
import { prisma } from '../lib/prisma'
import { invalidateMatchScoresForUser } from '../lib/redis'
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
// scrapes pages independently of the dashboard's dev-login flow. Fine for a local MVP;
// would need to move behind real auth before handling untrusted traffic.
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
  const user = await prisma.user.findFirst({ where: { id: userId, deleted: false } })
  if (!user) {
    res.status(404).json({ error: `Unknown userId ${userId}` })
    return
  }

  const job = await prisma.job.upsert({
    where: { platform_platformJobId: { platform: body.job.platform, platformJobId: body.job.platformJobId } },
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

  const interaction = await prisma.interaction.create({
    data: {
      userId,
      jobId: job.id,
      eventType: body.eventType,
      weight: INTERACTION_WEIGHTS[body.eventType],
      platform: body.job.platform
    }
  })

  // Interaction count feeds the collaborative/semantic blend weight for every job, not
  // just this one — see the same invalidation in the logInteraction GraphQL resolver.
  await invalidateMatchScoresForUser(userId)

  logger.info({ userId, jobId: job.id, eventType: body.eventType }, 'Interaction logged')
  res.status(201).json({ interactionId: interaction.id, jobId: job.id })
})
