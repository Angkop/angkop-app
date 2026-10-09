import Redis from 'ioredis'
import type { RecommendResponse } from '@angkop/shared'
import { logger } from './logger'

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

const MATCH_SCORE_TTL_SECONDS = 60 * 60 * 24

function matchScoreCacheKey(userId: string, jobId: string): string {
  return `match-score:${userId}:${jobId}`
}

// Looks up every (userId, jobId) pair's cached score in one MGET, then hands only the
// cache misses to `computeMissing` so the caller can score them in a single batched ML
// request instead of one request per job - this is what makes a feed-sized job list fast
// on a cold cache. Callers scoring just one job (e.g. the match insight dialog) call this
// with a single-element array instead of keeping a separate single-job code path.
export async function getOrSetMatchScores(
  userId: string,
  jobIds: string[],
  computeMissing: (missingJobIds: string[]) => Promise<Map<string, RecommendResponse>>
): Promise<Map<string, RecommendResponse>> {
  if (jobIds.length === 0) return new Map()

  const cached = await redis.mget(jobIds.map((jobId) => matchScoreCacheKey(userId, jobId)))

  const results = new Map<string, RecommendResponse>()
  const missingJobIds: string[] = []
  jobIds.forEach((jobId, index) => {
    const value = cached[index]
    if (value) {
      results.set(jobId, JSON.parse(value) as RecommendResponse)
    } else {
      missingJobIds.push(jobId)
    }
  })

  if (missingJobIds.length === 0) return results

  const computed = await computeMissing(missingJobIds)
  const pipeline = redis.pipeline()
  for (const [jobId, score] of computed) {
    results.set(jobId, score)
    pipeline.set(matchScoreCacheKey(userId, jobId), JSON.stringify(score), 'EX', MATCH_SCORE_TTL_SECONDS)
  }
  await pipeline.exec()

  return results
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
