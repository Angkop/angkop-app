import Redis from 'ioredis'
import type { RecommendResponse, SkillGapResponse } from '@angkop/shared'
import { logger } from './logger'

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

const MATCH_SCORE_TTL_SECONDS = 60 * 60 * 24
const SKILL_GAPS_TTL_SECONDS = 60 * 60 * 24

function matchScoreCacheKey(userId: string, jobId: string): string {
  return `match-score:${userId}:${jobId}`
}

function matchScoreInFlightKey(userId: string, jobId: string): string {
  return `${userId}:${jobId}`
}

// Two concurrent requests racing the same cache miss (e.g. two browser tabs loading the
// feed at once, or the feed and the match-insight dialog both missing on the same job)
// would otherwise both pay for their own ML call for that job. Keyed by (userId, jobId)
// rather than by batch, since two concurrent callers rarely ask for the exact same job
// list - only the overlapping jobs should be shared, not the whole request.
const inFlightMatchScores = new Map<string, Promise<RecommendResponse>>()

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

  // Jobs another concurrent call is already computing are awaited instead of recomputed;
  // only genuinely new misses start a new batched ML call.
  const toCompute: string[] = []
  const waiters: Promise<void>[] = []
  for (const jobId of missingJobIds) {
    const existing = inFlightMatchScores.get(matchScoreInFlightKey(userId, jobId))
    if (existing) {
      waiters.push(
        existing.then((score) => {
          results.set(jobId, score)
        })
      )
    } else {
      toCompute.push(jobId)
    }
  }

  if (toCompute.length > 0) {
    const batchPromise = computeMissing(toCompute)

    for (const jobId of toCompute) {
      const perJobPromise = batchPromise.then((computed) => computed.get(jobId)!)
      // Suppresses a Node "unhandled rejection" warning on this specific promise object if
      // no concurrent caller ever awaits it - the real rejection still propagates below via
      // the direct `await batchPromise`, and to any waiter's own `.then()` chain above.
      perJobPromise.catch(() => {})
      inFlightMatchScores.set(matchScoreInFlightKey(userId, jobId), perJobPromise)
    }

    try {
      const computed = await batchPromise
      const pipeline = redis.pipeline()
      for (const [jobId, score] of computed) {
        results.set(jobId, score)
        pipeline.set(
          matchScoreCacheKey(userId, jobId),
          JSON.stringify(score),
          'EX',
          MATCH_SCORE_TTL_SECONDS
        )
      }
      await pipeline.exec()
    } finally {
      for (const jobId of toCompute) {
        inFlightMatchScores.delete(matchScoreInFlightKey(userId, jobId))
      }
    }
  }

  await Promise.all(waiters)

  return results
}

// Called after a profile update so the next jobMatches query recomputes fresh scores
// instead of serving up to 24h of stale ones from before the edit. SCAN instead of KEYS
// so invalidation never blocks the single-threaded Redis server while it walks the
// keyspace, same pattern as scripts/reset-all-data.ts's deleteRedisKeys.
export async function invalidateMatchScoresForUser(userId: string): Promise<void> {
  const pattern = matchScoreCacheKey(userId, '*')
  let cursor = '0'
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 500)
    cursor = nextCursor
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } while (cursor !== '0')
}

function skillGapsCacheKey(userId: string): string {
  return `skill-gaps:${userId}`
}

// The skill-gap report calls the ML service and persists a SkillGapRecord per missing
// skill - without this cache, revisiting the page (or any refetch) re-runs both on every
// single request even when nothing about the user's saved jobs or skills has changed.
// Mirrors getOrSetMatchScores: cache the whole computed report, invalidate explicitly
// wherever its inputs (saved jobs, skills) change, with a 24h TTL as a backstop.
export async function getOrSetSkillGaps(
  userId: string,
  compute: () => Promise<SkillGapResponse>
): Promise<SkillGapResponse> {
  const cached = await redis.get(skillGapsCacheKey(userId))
  if (cached) return JSON.parse(cached) as SkillGapResponse

  const computed = await compute()
  await redis.set(skillGapsCacheKey(userId), JSON.stringify(computed), 'EX', SKILL_GAPS_TTL_SECONDS)
  return computed
}

export async function invalidateSkillGapsForUser(userId: string): Promise<void> {
  await redis.del(skillGapsCacheKey(userId))
}

redis.on('error', (error) => {
  logger.error({ error }, 'Redis connection error')
})
