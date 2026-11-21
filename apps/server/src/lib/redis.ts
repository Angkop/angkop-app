import Redis from 'ioredis'
import type { SkillGapResponse } from '@angkop/shared'
import { logger } from './logger'

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

const MATCH_SCORE_TTL_SECONDS = 60 * 60 * 24
const SKILL_GAPS_TTL_SECONDS = 60 * 60 * 24
// Fields per HMGET / HSET. A whole catalog in one command grows with every ingested job and
// would eventually trip a managed Redis's request-size limit, so large lists go out in chunks
// (still one pipelined round trip).
const MATCH_SCORE_FIELDS_PER_COMMAND = 1000

// What the cache holds for a (user, job) pair: the two scores the hybrid blend is made of, not
// the blend itself. The blend's weight depends on the user's interaction count, so caching the
// blended score meant every view/save/dismiss had to throw the user's whole cache away. The
// ingredients only change when the profile does (semantic) or the model is retrained
// (collaborative), so the count is read live and applied on every read instead
// (see blendHybridScore in @angkop/shared).
export type MatchScoreComponents = {
  semanticScore: number
  collaborativeScore: number
}

// One hash per user, one field per job, instead of one key per (user, job). Invalidating a
// user is a single DEL rather than a SCAN across every key in Redis, and the key count stays
// at "users" instead of "users x jobs".
function matchScoresCacheKey(userId: string): string {
  return `match-scores:${userId}`
}

// "<semantic>,<collaborative>" - number-to-string round-trips exactly in JS, so a cached score
// reads back bit-identical to what was computed.
function serializeComponents(components: MatchScoreComponents): string {
  return `${components.semanticScore},${components.collaborativeScore}`
}

function parseComponents(value: string): MatchScoreComponents | null {
  const [semantic, collaborative] = value.split(',')
  const semanticScore = Number(semantic)
  const collaborativeScore = Number(collaborative)
  if (collaborative === undefined || !Number.isFinite(semanticScore) || !Number.isFinite(collaborativeScore)) {
    return null
  }
  return { semanticScore, collaborativeScore }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let start = 0; start < items.length; start += size) {
    chunks.push(items.slice(start, start + size))
  }
  return chunks
}

function matchScoreInFlightKey(userId: string, jobId: string): string {
  return `${userId}:${jobId}`
}

// Two concurrent requests racing the same cache miss (e.g. two browser tabs loading the
// feed at once, or the feed and the match-insight dialog both missing on the same job)
// would otherwise both pay for their own ML call for that job. Keyed by (userId, jobId)
// rather than by batch, since two concurrent callers rarely ask for the exact same job
// list - only the overlapping jobs should be shared, not the whole request.
const inFlightMatchScores = new Map<string, Promise<MatchScoreComponents>>()

// Looks up every job's cached components for this user in one pipelined HMGET, then hands only
// the cache misses to `computeMissing` so the caller can score them in a single batched ML
// request instead of one request per job - this is what makes a feed-sized job list fast
// on a cold cache. Callers scoring just one job (e.g. the match insight dialog) call this
// with a single-element array instead of keeping a separate single-job code path.
export async function getOrSetMatchScoreComponents(
  userId: string,
  jobIds: string[],
  computeMissing: (missingJobIds: string[]) => Promise<Map<string, MatchScoreComponents>>
): Promise<Map<string, MatchScoreComponents>> {
  if (jobIds.length === 0) return new Map()

  const key = matchScoresCacheKey(userId)
  const readPipeline = redis.pipeline()
  const jobIdChunks = chunk(jobIds, MATCH_SCORE_FIELDS_PER_COMMAND)
  for (const jobIdChunk of jobIdChunks) {
    readPipeline.hmget(key, ...jobIdChunk)
  }
  const replies = await readPipeline.exec()
  if (!replies) throw new Error('Redis returned no reply for the match score read')

  const results = new Map<string, MatchScoreComponents>()
  const missingJobIds: string[] = []
  jobIdChunks.forEach((jobIdChunk, chunkIndex) => {
    const [error, values] = replies[chunkIndex]
    if (error) throw error
    jobIdChunk.forEach((jobId, index) => {
      const value = (values as (string | null)[])[index]
      const parsed = value ? parseComponents(value) : null
      if (parsed) {
        results.set(jobId, parsed)
      } else {
        missingJobIds.push(jobId)
      }
    })
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
        existing.then((components) => {
          results.set(jobId, components)
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
      const writePipeline = redis.pipeline()
      const fields: [string, string][] = []
      for (const [jobId, components] of computed) {
        results.set(jobId, components)
        fields.push([jobId, serializeComponents(components)])
      }
      for (const fieldChunk of chunk(fields, MATCH_SCORE_FIELDS_PER_COMMAND)) {
        writePipeline.hset(key, Object.fromEntries(fieldChunk))
      }
      // NX: only the first write starts the clock. Without it, every nightly ingest's new jobs
      // would push the expiry out again and a profile's scores could outlive the 24h bound
      // indefinitely (e.g. across a model retrain).
      writePipeline.expire(key, MATCH_SCORE_TTL_SECONDS, 'NX')
      await writePipeline.exec()
    } finally {
      for (const jobId of toCompute) {
        inFlightMatchScores.delete(matchScoreInFlightKey(userId, jobId))
      }
    }
  }

  await Promise.all(waiters)

  return results
}

// Called after a profile update, since the skills text feeds the semantic score of every job -
// the next jobMatches query recomputes fresh scores instead of serving up to 24h of stale ones
// from before the edit. A single DEL: interactions deliberately do NOT call this, because the
// interaction count is applied to the cached components on every read.
export async function invalidateMatchScoresForUser(userId: string): Promise<void> {
  await redis.del(matchScoresCacheKey(userId))
}

function skillGapsCacheKey(userId: string): string {
  return `skill-gaps:${userId}`
}

// The skill-gap report calls the ML service and persists a SkillGapRecord per missing
// skill - without this cache, revisiting the page (or any refetch) re-runs both on every
// single request even when nothing about the user's saved jobs or skills has changed.
// Mirrors getOrSetMatchScoreComponents: cache the whole computed report, invalidate explicitly
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
