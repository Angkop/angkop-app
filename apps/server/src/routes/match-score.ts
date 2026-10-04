import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSetMatchScore } from '../lib/redis'
import { recommend } from '../lib/ml-client'

const DEMO_USER_ID = 'demo-user-1'

export const matchScoreRouter = Router()

// Used by the browser extension's overlay, which isn't behind the dashboard's Google
// sign-in — mirrors the scoring logic in the jobMatches GraphQL resolver for a single job.
matchScoreRouter.get('/:jobId', async (req, res) => {
  const userId = typeof req.query.userId === 'string' ? req.query.userId : DEMO_USER_ID
  const job = await prisma.job.findFirst({ where: { id: req.params.jobId, deleted: false } })
  if (!job) {
    res.status(404).json({ error: `Unknown jobId ${req.params.jobId}` })
    return
  }

  const [profile, interactionCount] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.interaction.count({ where: { userId, deleted: false } })
  ])

  const score = await getOrSetMatchScore(userId, job.id, () =>
    recommend({
      userId,
      jobId: job.id,
      userSkillsText: profile?.skillsText ?? '',
      jobText: `${job.title}. ${job.description}`,
      userInteractionCount: interactionCount
    })
  )

  res.json(score)
})
