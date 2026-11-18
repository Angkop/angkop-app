import { randomUUID } from 'node:crypto'
import type { Redis } from 'ioredis'
import type { Logger } from 'pino'
import type { Prisma, PrismaClient } from '@prisma/client'
import type { EmbedRequest, EmbedResponse } from '@angkop/shared'
import { detectExperienceLevel } from '../../lib/experience-detection'
import { detectSkillsFromTaxonomy } from '../../lib/skill-detection'
import {
  DAILY_NEW_JOBS_INTERNATIONAL,
  DAILY_NEW_JOBS_PH,
  HEADCOUNTLABS_ID_PREFIX,
  HEADCOUNTLABS_LAST_CHECKED_KEY,
  HEADCOUNTLABS_STALE_CHECKS_PER_RUN,
  INGEST_LOCK_KEY,
  INGEST_LOCK_TTL_SECONDS,
  MAX_CONSECUTIVE_FAILURES,
  STALE_MIN_FEED_SIZE
} from './constants'
import { joinSections } from './description-sections'
import { detectEmploymentType, detectWorkSetup, parseSalary } from './listing-facts'
import { detectLanguage } from './posting-language'
import { fetchArbeitnow } from './sources/arbeitnow'
import { checkHeadcountLabsJobs, fetchHeadcountLabs } from './sources/headcountlabs'
import { fetchRemoteOk } from './sources/remoteok'
import type { NormalizedListing, SourceFetchResult } from './types'

const MAX_REQUIRED_SKILLS = 8
const MATCH_SCORE_KEY_PREFIX = 'match-score:'

type Bucket = 'international' | 'ph'

type Source = {
  name: string
  sourceName: string
  bucket: Bucket
  fetch: () => Promise<SourceFetchResult>
}

const SOURCES: Source[] = [
  { name: 'remoteok', sourceName: 'RemoteOK', bucket: 'international', fetch: fetchRemoteOk },
  { name: 'arbeitnow', sourceName: 'Arbeitnow', bucket: 'international', fetch: fetchArbeitnow },
  { name: 'headcountlabs', sourceName: 'Headcount Labs', bucket: 'ph', fetch: fetchHeadcountLabs }
]

export const SOURCE_NAMES = SOURCES.map((source) => source.name)

export type IngestOptions = {
  dryRun: boolean
  // Limits the run to one source (a source's `name`, not its `sourceName`).
  onlySource?: string
  // Ignores the daily caps and ingests everything fetched — the old behavior, for backfills.
  full?: boolean
}

export type IngestStats = {
  fetched: number
  created: number
  updated: number
  skipped: number
  failed: number
  staleRemoved: number
}

export type IngestResult = {
  // ok: everything ran. partial: finished, but a source failed or a step was skipped.
  // failed: nothing could run. skipped: another run holds the lock.
  status: 'ok' | 'partial' | 'failed' | 'skipped'
  stats: IngestStats
}

type FetchedSource = { source: Source; result: SourceFetchResult | null }

type IngestDeps = {
  prisma: PrismaClient
  redis: Redis
  logger: Logger
  embed: (request: EmbedRequest) => Promise<EmbedResponse>
  webUrl: string
}

// Tops up a source's own (often sparse) tags with skills mentioned in the free-text
// description, instead of replacing them — the source's own tags are more reliable
// when present. `skillNames` is the live Skill taxonomy, not a hardcoded list.
function withSkillFallback(requiredSkills: string[], fullText: string, skillNames: string[]): string[] {
  if (requiredSkills.length >= MAX_REQUIRED_SKILLS) return requiredSkills
  const existingLower = new Set(requiredSkills.map((skill) => skill.toLowerCase()))
  const detected = detectSkillsFromTaxonomy(fullText, skillNames).filter(
    (skill) => !existingLower.has(skill.toLowerCase())
  )
  return [...requiredSkills, ...detected].slice(0, MAX_REQUIRED_SKILLS)
}

// Takes listings from each list in turn, so a bucket fed by two sources draws on both
// instead of filling up from whichever came first.
function interleave<T>(lists: T[][]): T[] {
  const merged: T[] = []
  const longest = Math.max(0, ...lists.map((list) => list.length))
  for (let index = 0; index < longest; index++) {
    for (const list of lists) if (index < list.length) merged.push(list[index])
  }
  return merged
}

// Refreshes the job list nightly: removes listings that are no longer on their source, then
// brings in a fixed number of new ones per bucket (25 international, 25 Philippine).
export class IngestJobsService {
  constructor(private readonly deps: IngestDeps) {}

  async execute(options: IngestOptions): Promise<IngestResult> {
    const { logger, redis } = this.deps
    const startedAt = new Date()
    const stats: IngestStats = { fetched: 0, created: 0, updated: 0, skipped: 0, failed: 0, staleRemoved: 0 }
    logger.info({ startedAt: startedAt.toISOString(), ...options }, 'Job ingest started')

    const lockToken = randomUUID()
    const locked = await redis.set(INGEST_LOCK_KEY, lockToken, 'EX', INGEST_LOCK_TTL_SECONDS, 'NX')
    if (locked !== 'OK') {
      logger.warn('Job ingest skipped: a previous run is still going')
      return { status: 'skipped', stats }
    }

    let status: IngestResult['status'] = 'ok'
    try {
      status = await this.run(options, stats)
    } catch (error) {
      logger.error({ error }, 'Job ingest failed')
      status = 'failed'
    } finally {
      await this.releaseLock(lockToken)
      const finishedAt = new Date()
      const summary = {
        status,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        dryRun: options.dryRun,
        ...stats
      }
      if (status === 'ok') logger.info(summary, 'Job ingest finished')
      else logger.error(summary, 'Job ingest finished with problems')
    }
    return { status, stats }
  }

  // Deletes the lock only if it is still ours, so a run that outlived its TTL can't release
  // the lock a newer run has since taken.
  private async releaseLock(token: string): Promise<void> {
    await this.deps.redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) end return 0",
      1,
      INGEST_LOCK_KEY,
      token
    )
  }

  private async run(options: IngestOptions, stats: IngestStats): Promise<IngestResult['status']> {
    const { logger } = this.deps
    let status: IngestResult['status'] = 'ok'

    const sources = SOURCES.filter((source) => !options.onlySource || source.name === options.onlySource)
    const fetched = await Promise.all(sources.map((source) => this.fetchSource(source)))
    for (const { source, result } of fetched) {
      if (result === null) status = 'partial'
      else stats.fetched += result.listings.length
      logger.info(
        { source: source.name, fetched: result?.listings.length ?? 0, complete: result?.complete ?? false },
        'Source fetched'
      )
    }
    if (fetched.every(({ result }) => result === null)) {
      logger.error('Every source failed, nothing to ingest')
      return 'failed'
    }

    // Removal first, so the listings we are about to add are never judged against a feed
    // that predates them.
    const stale = await Promise.all(fetched.map((entry) => this.findStaleJobIds(entry, options)))
    if (stale.some((ids) => ids === null)) status = 'partial'
    const staleIds = stale.flatMap((ids) => ids ?? [])
    await this.removeStaleJobs(staleIds, options.dryRun)
    stats.staleRemoved = staleIds.length

    // Loaded once per run, not per listing: the canonical skill names job seekers have
    // actually entered on their profiles, spanning whatever industries are on the platform.
    const skillNames = (
      await this.deps.prisma.skill.findMany({ where: { deleted: false }, select: { name: true } })
    ).map((skill) => skill.name)

    for (const bucket of ['international', 'ph'] as const) {
      const bucketSources = fetched.filter((entry) => entry.source.bucket === bucket)
      if (bucketSources.length === 0) continue
      const cap = options.full ? Infinity : bucket === 'international' ? DAILY_NEW_JOBS_INTERNATIONAL : DAILY_NEW_JOBS_PH
      const bucketStatus = await this.ingestBucket(bucket, bucketSources, cap, skillNames, options, stats)
      if (bucketStatus === 'partial') status = 'partial'
    }
    return status
  }

  private async fetchSource(source: Source): Promise<FetchedSource> {
    try {
      return { source, result: await source.fetch() }
    } catch (error) {
      this.deps.logger.error({ error, source: source.name }, 'Source failed, continuing with the others')
      return { source, result: null }
    }
  }

  // Ids of stored jobs that their source no longer lists, or null if that source's feed
  // can't be trusted this run. Jobs a user has saved are never returned — they stay visible
  // so a tracked application doesn't vanish from under the person tracking it.
  private async findStaleJobIds({ source, result }: FetchedSource, options: IngestOptions): Promise<string[] | null> {
    const { prisma, logger } = this.deps
    if (result === null) return null

    let goneIds: string[]
    if (source.name === 'headcountlabs') {
      const expired = await this.findHeadcountLabsExpiredIds(options.dryRun)
      if (expired === null) return null
      goneIds = expired
    } else {
      if (!result.complete) {
        logger.warn({ source: source.name }, 'Feed was only partly read, skipping stale check')
        return null
      }
      if (result.listings.length < STALE_MIN_FEED_SIZE) {
        logger.error(
          { source: source.name, fetched: result.listings.length },
          'Feed is suspiciously small, skipping stale check'
        )
        return null
      }
      const feedIds = new Set(result.listings.map((listing) => listing.id))
      const stored = await prisma.job.findMany({
        where: { platform: 'angkop', sourceName: source.sourceName, deleted: false },
        select: { id: true }
      })
      goneIds = stored.map((job) => job.id).filter((id) => !feedIds.has(id))
    }
    if (goneIds.length === 0) return []

    const saved = await prisma.savedJob.findMany({
      where: { jobId: { in: goneIds }, deleted: false },
      select: { jobId: true }
    })
    const keep = new Set(saved.map((entry) => entry.jobId))
    const stale = goneIds.filter((id) => !keep.has(id))
    logger.info(
      { source: source.name, stale: stale.length, keptBecauseSaved: keep.size },
      'Stale jobs found'
    )
    return stale
  }

  // Headcount Labs can't be diffed against a feed (we only read its newest few hundred of
  // tens of thousands), so each stored posting is asked about directly instead. That is one
  // request per posting, so a run checks the HEADCOUNTLABS_STALE_CHECKS_PER_RUN that were
  // checked longest ago (never-checked first) and the rest rotate in on later nights.
  private async findHeadcountLabsExpiredIds(dryRun: boolean): Promise<string[] | null> {
    const { redis, prisma, logger } = this.deps
    const stored = await prisma.job.findMany({
      where: { platform: 'angkop', sourceName: 'Headcount Labs', deleted: false },
      select: { id: true }
    })
    if (stored.length === 0) return []

    const ids = stored.map((job) => job.id)
    const lastChecked = await redis.zmscore(HEADCOUNTLABS_LAST_CHECKED_KEY, ...ids)
    const queue = ids
      .map((id, index) => ({ id, checkedAt: lastChecked[index] === null ? -1 : Number(lastChecked[index]) }))
      .sort((a, b) => a.checkedAt - b.checkedAt)
      .slice(0, HEADCOUNTLABS_STALE_CHECKS_PER_RUN)
      .map((entry) => entry.id)

    const { checked, withdrawn } = await checkHeadcountLabsJobs(queue)
    if (!dryRun && checked.length > 0) {
      const now = Date.now()
      await redis.zadd(HEADCOUNTLABS_LAST_CHECKED_KEY, ...checked.flatMap((id) => [now, id]))
    }
    logger.info({ stored: stored.length, checked: checked.length }, 'Headcount Labs postings checked')
    return withdrawn
  }

  private async removeStaleJobs(jobIds: string[], dryRun: boolean): Promise<void> {
    if (jobIds.length === 0 || dryRun) return
    // Soft delete, same as everywhere else in this schema. The job's sections stay as they
    // are; every read filters on the job's own `deleted` flag.
    await this.deps.prisma.job.updateMany({ where: { id: { in: jobIds }, deleted: false }, data: { deleted: true } })
    await this.invalidateMatchScores(jobIds)
  }

  // Cached match scores for a removed job would otherwise sit in Redis until their 24h TTL.
  // One SCAN over the match-score keys, filtered by job id, like invalidateMatchScoresForUser.
  private async invalidateMatchScores(jobIds: string[]): Promise<void> {
    const { redis } = this.deps
    const targets = new Set(jobIds)
    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${MATCH_SCORE_KEY_PREFIX}*`, 'COUNT', 500)
      cursor = nextCursor
      // Key shape is match-score:<userId>:<jobId>.
      const doomed = keys.filter((key) => targets.has(key.split(':').slice(2).join(':')))
      if (doomed.length > 0) await redis.del(...doomed)
    } while (cursor !== '0')
  }

  private async ingestBucket(
    bucket: Bucket,
    bucketSources: FetchedSource[],
    cap: number,
    skillNames: string[],
    options: IngestOptions,
    stats: IngestStats
  ): Promise<IngestResult['status']> {
    const { prisma, logger } = this.deps
    const listings = interleave(bucketSources.map(({ result }) => result?.listings ?? []))
    if (listings.length === 0) {
      logger.warn({ bucket }, 'No listings fetched for this bucket')
      return 'ok'
    }

    // SAFE: deliberately includes deleted rows. A listing we removed as stale that shows up
    // in its feed again must be revived, not re-created (the (platform, platformJobId)
    // unique key would reject the insert) and not skipped (it would stay hidden for good).
    const existing = await prisma.job.findMany({
      where: { platform: 'angkop', id: { in: listings.map((listing) => listing.id) } },
      select: { id: true, deleted: true }
    })
    const existingById = new Map(existing.map((job) => [job.id, job.deleted]))

    const toRevive = listings.filter((listing) => existingById.get(listing.id) === true)
    const fresh = listings.filter((listing) => !existingById.has(listing.id))
    stats.skipped += listings.length - toRevive.length - fresh.length

    let created = 0
    let consecutiveFailures = 0
    let bucketStatus: IngestResult['status'] = 'ok'

    const attempt = async (listing: NormalizedListing, isRevival: boolean): Promise<boolean> => {
      try {
        if (!options.dryRun) await this.writeListing(listing, skillNames)
        if (isRevival) stats.updated++
        else stats.created++
        consecutiveFailures = 0
        return true
      } catch (error) {
        stats.failed++
        consecutiveFailures++
        logger.warn({ error, listingId: listing.id }, 'Listing failed, skipping it')
        return false
      }
    }

    for (const listing of toRevive) await attempt(listing, true)

    for (const listing of fresh) {
      if (created >= cap) break
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        logger.error({ bucket }, 'Too many failures in a row, stopping this bucket')
        bucketStatus = 'partial'
        break
      }
      if (await attempt(listing, false)) created++
    }

    if (created < cap && Number.isFinite(cap)) {
      logger.warn({ bucket, created, target: cap, candidates: fresh.length }, 'Fewer new listings than the daily target')
    }
    logger.info({ bucket, created, target: cap, revived: toRevive.length }, 'Bucket ingested')
    return bucketStatus
  }

  // Embeds the listing first, then writes the job and its sections in one transaction, so a
  // failed embedding or write never leaves a job without sections or a half-written one.
  private async writeListing(listing: NormalizedListing, skillNames: string[]): Promise<void> {
    const { prisma, embed, webUrl } = this.deps
    const fullText = joinSections(listing.descriptionSections)
    const [{ embedding }, detectedLanguage] = await Promise.all([
      embed({ text: `${listing.title}. ${listing.description}` }),
      detectLanguage(listing.description)
    ])

    // The source's own structured values win; the posting's wording only fills what the
    // source left empty.
    const parsedSalary =
      listing.salaryMin === null && listing.salaryMax === null ? parseSalary(fullText) : null
    const fields = {
      title: listing.title,
      company: listing.company,
      description: listing.description,
      detectedLanguage,
      requiredSkills: withSkillFallback(listing.requiredSkills, fullText, skillNames),
      experienceLevel: detectExperienceLevel(fullText, listing.title),
      url: `${webUrl}/listings/${listing.id}`,
      sourceName: listing.sourceName,
      sourceUrl: listing.sourceUrl,
      location: listing.location,
      salaryMin: parsedSalary ? parsedSalary.min : listing.salaryMin,
      salaryMax: parsedSalary ? parsedSalary.max : listing.salaryMax,
      salaryCurrency: parsedSalary ? parsedSalary.currency : listing.salaryCurrency,
      salaryPeriod: parsedSalary ? parsedSalary.period : listing.salaryPeriod,
      workSetup: listing.workSetup ?? detectWorkSetup(listing.title, fullText),
      employmentType: listing.employmentType ?? detectEmploymentType(listing.title, fullText),
      embedding,
      deleted: false
    }

    // Each section is upserted by its position, so re-ingesting a listing updates existing
    // rows in place instead of duplicating them; trailing sections the source no longer has
    // are soft-deleted. Sent as one batch instead of one query per section, which also keeps
    // within Supabase's pooler connection cap.
    const operations: Prisma.PrismaPromise<unknown>[] = [
      prisma.job.upsert({
        where: { platform_platformJobId: { platform: 'angkop', platformJobId: listing.id } },
        update: fields,
        create: { id: listing.id, platformJobId: listing.id, platform: 'angkop', ...fields }
      }),
      ...listing.descriptionSections.map((section, order) =>
        prisma.jobDescriptionSection.upsert({
          where: { jobId_order: { jobId: listing.id, order } },
          update: { heading: section.heading, items: section.items, deleted: false },
          create: { jobId: listing.id, order, heading: section.heading, items: section.items }
        })
      ),
      prisma.jobDescriptionSection.updateMany({
        where: { jobId: listing.id, order: { gte: listing.descriptionSections.length }, deleted: false },
        data: { deleted: true }
      })
    ]
    await prisma.$transaction(operations)
  }
}
