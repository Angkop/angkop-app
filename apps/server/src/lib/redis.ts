import Redis from 'ioredis'
import type { RecommendResponse } from '@angkop/shared'
import { logger } from './logger'

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

const MATCH_SCORE_TTL_SECONDS = 60 * 60 * 24

function matchScoreCacheKey(userId: string, jobId: string): string {
  return `match-score:${userId}:${jobId}`
}

export async function getOrSetMatchScore(
  userId: string,
  jobId: string,
  compute: () => Promise<RecommendResponse>
): Promise<RecommendResponse> {
  const key = matchScoreCacheKey(userId, jobId)
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached) as RecommendResponse
  }

  const result = await compute()
  await redis.set(key, JSON.stringify(result), 'EX', MATCH_SCORE_TTL_SECONDS)
  return result
}

// Called after a profile update so the next jobMatches query recomputes fresh scores
// instead of serving up to 24h of stale ones from before the edit. KEYS is fine at this
// dataset size (a handful of jobs per user) — would need SCAN instead at real scale.
export async function invalidateMatchScoresForUser(userId: string): Promise<void> {
  const keys = await redis.keys(matchScoreCacheKey(userId, '*'))
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

redis.on('error', (error) => {
  logger.error({ error }, 'Redis connection error')
})
