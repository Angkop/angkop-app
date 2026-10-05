import type { ParsedResumeProfile } from '@angkop/shared'
import { redis } from './redis'

const COOLDOWN_SECONDS = Number(process.env.RESUME_USER_COOLDOWN_SECONDS ?? 30)
const MAX_PER_DAY = Number(process.env.RESUME_MAX_NEW_PARSES_PER_USER_PER_DAY ?? 10)
const MAX_PER_WEEK = Number(process.env.RESUME_MAX_NEW_PARSES_PER_USER_PER_WEEK ?? 30)
const GLOBAL_DAILY_SOFT_CAP = Number(process.env.RESUME_GLOBAL_DAILY_SOFT_CAP ?? 800)
const BREAKER_PAUSE_MINUTES = Number(process.env.RESUME_BREAKER_PAUSE_MINUTES ?? 5)
const CACHE_TTL_SECONDS = Number(process.env.RESUME_CACHE_TTL_DAYS ?? 90) * 24 * 60 * 60

const BREAKER_FAILURE_THRESHOLD = 3
const DAY_SECONDS = 60 * 60 * 26 // a couple hours past 24h so the key outlives the Pacific day it names
const WEEK_SECONDS = 60 * 60 * 24 * 8

// Pacific calendar date, since that's when Gemini's free-tier daily quota resets.
function pacificDateKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date())
}

// A coarse week bucket (not true ISO weeks) — good enough for a soft weekly cap, and
// avoids needing exact Pacific-week-boundary math for something this forgiving.
function weekBucketKey(): string {
  return String(Math.floor(Date.now() / 86_400_000 / 7))
}

function cooldownKey(userId: string) {
  return `resume:cooldown:${userId}`
}
function dailyUserKey(userId: string) {
  return `resume:daily:${userId}:${pacificDateKey()}`
}
function weeklyUserKey(userId: string) {
  return `resume:weekly:${userId}:${weekBucketKey()}`
}
function globalDailyKey() {
  return `resume:global-daily:${pacificDateKey()}`
}
function cacheKey(userId: string, hash: string) {
  return `resume:cache:${userId}:${hash}`
}

const BREAKER_OPEN_KEY = 'resume:breaker:open-until'
const BREAKER_FAIL_KEY = 'resume:breaker:fail-count'

export type QuotaBlock =
  | { kind: 'breaker-open' }
  | { kind: 'cooldown'; retryAfterSeconds: number }
  | { kind: 'daily-limit' }
  | { kind: 'weekly-limit' }
  | { kind: 'global-cap' }

// Call once per request, before deciding to call Gemini. Returns null when clear to
// proceed. Does not itself consume the user's daily/weekly allowance — that only happens
// via recordUserParse, once we're committed to an actual Gemini call (a request blocked
// here, or satisfied entirely from cache, never counts against the user's own quota).
export async function checkQuota(userId: string): Promise<QuotaBlock | null> {
  const openUntil = await redis.get(BREAKER_OPEN_KEY)
  if (openUntil && Date.now() < Number(openUntil)) {
    return { kind: 'breaker-open' }
  }

  const cooldownTtl = await redis.ttl(cooldownKey(userId))
  if (cooldownTtl > 0) {
    return { kind: 'cooldown', retryAfterSeconds: cooldownTtl }
  }

  const [dailyCount, weeklyCount] = await Promise.all([redis.get(dailyUserKey(userId)), redis.get(weeklyUserKey(userId))])
  if (Number(dailyCount ?? 0) >= MAX_PER_DAY) return { kind: 'daily-limit' }
  if (Number(weeklyCount ?? 0) >= MAX_PER_WEEK) return { kind: 'weekly-limit' }

  const globalCount = await redis.incr(globalDailyKey())
  await redis.expire(globalDailyKey(), DAY_SECONDS)
  if (globalCount > GLOBAL_DAILY_SOFT_CAP) return { kind: 'global-cap' }

  return null
}

// Marks this request as a genuinely new parse against the user's own cooldown/daily/
// weekly allowance. Call right before the Gemini call this quota is protecting.
export async function recordUserParse(userId: string): Promise<void> {
  await Promise.all([
    redis.set(cooldownKey(userId), '1', 'EX', COOLDOWN_SECONDS),
    redis.incr(dailyUserKey(userId)).then(() => redis.expire(dailyUserKey(userId), DAY_SECONDS)),
    redis.incr(weeklyUserKey(userId)).then(() => redis.expire(weeklyUserKey(userId), WEEK_SECONDS))
  ])
}

// Opens after BREAKER_FAILURE_THRESHOLD consecutive Gemini failures, pausing all calls
// for RESUME_BREAKER_PAUSE_MINUTES so a flaky upstream doesn't turn into a call storm.
export async function recordGeminiFailure(): Promise<void> {
  const failures = await redis.incr(BREAKER_FAIL_KEY)
  await redis.expire(BREAKER_FAIL_KEY, 60 * 10)
  if (failures >= BREAKER_FAILURE_THRESHOLD) {
    const openUntil = Date.now() + BREAKER_PAUSE_MINUTES * 60_000
    await redis.set(BREAKER_OPEN_KEY, String(openUntil), 'PX', BREAKER_PAUSE_MINUTES * 60_000)
    await redis.del(BREAKER_FAIL_KEY)
  }
}

export async function recordGeminiSuccess(): Promise<void> {
  await redis.del(BREAKER_FAIL_KEY)
}

export async function getCachedParse(userId: string, textHash: string): Promise<ParsedResumeProfile | null> {
  const cached = await redis.get(cacheKey(userId, textHash))
  return cached ? (JSON.parse(cached) as ParsedResumeProfile) : null
}

export async function setCachedParse(userId: string, textHash: string, parsed: ParsedResumeProfile): Promise<void> {
  await redis.set(cacheKey(userId, textHash), JSON.stringify(parsed), 'EX', CACHE_TTL_SECONDS)
}
