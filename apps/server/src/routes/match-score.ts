import { EMBEDDING_DIMENSIONS } from '@angkop/shared'
import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { getOrSetMatchScores } from '../lib/redis'
import { recommend } from '../lib/ml-client'

const DEMO_USER_ID = 'demo-user-1'

// A user with no stored embedding yet (no completed onboarding) scores against a neutral
// zero vector instead of re-embedding text on every overlay request - see the equivalent
// fallback in graphql/resolvers/helpers.ts.
const ZERO_EMBEDDING: number[] = new Array(EMBEDDING_DIMENSIONS).fill(0)

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

  const userEmbedding = profile && profile.embedding.length > 0 ? profile.embedding : ZERO_EMBEDDING
  const scoresByJobId = await getOrSetMatchScores(userId, [job.id], async () => {
    const score = await recommend({
      userId,
      jobId: job.id,
      userEmbedding,
      jobEmbedding: job.embedding,
      userInteractionCount: interactionCount
    })
    return new Map([[job.id, score]])
  })

  res.json(scoresByJobId.get(job.id))
})
