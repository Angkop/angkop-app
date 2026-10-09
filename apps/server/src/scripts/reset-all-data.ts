// Full environment reset — wipes every row in every table plus the Redis match-score and
// resume caches, so the app starts from a genuinely blank slate (same Google account can
// sign in again, same job postings can be re-ingested with new ids, etc.).
//
// Run: tsx src/scripts/reset-all-data.ts        (dry run — counts only, deletes nothing)
//      DRY_RUN=false tsx src/scripts/reset-all-data.ts   (actually deletes)
//
// SAFE: hard delete instead of soft-delete, by explicit developer request (pre-launch thesis
// dev data, no audit requirement). Soft-deleting wouldn't actually achieve "start fresh" here
// anyway — User.email, Job[platform,platformJobId], SavedJob[userId,jobId] etc. are plain
// unique constraints that still apply to deleted:true rows, so the same test account/job
// could never be re-created without this.
import 'dotenv/config'
import { PrismaClient, type Prisma } from '@prisma/client'
import { logger } from '../lib/logger'
import { redis } from '../lib/redis'

const prisma = new PrismaClient()
const DRY_RUN = process.env.DRY_RUN !== 'false'

const REDIS_KEY_PATTERNS = ['match-score:*', 'resume:*']

async function countRedisKeys(pattern: string): Promise<number> {
  let count = 0
  let cursor = '0'
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 500)
    cursor = nextCursor
    count += keys.length
  } while (cursor !== '0')
  return count
}

async function deleteRedisKeys(pattern: string): Promise<number> {
  let deleted = 0
  let cursor = '0'
  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 500)
    cursor = nextCursor
    if (keys.length > 0) {
      await redis.del(...keys)
      deleted += keys.length
    }
  } while (cursor !== '0')
  return deleted
}

// The common surface every model delegate below is used through — just enough to count
// and bulk-delete, so a heterogeneous array of delegates can share one element type.
type DeletableDelegate = {
  count(): Promise<number>
  deleteMany(args: Record<string, never>): Prisma.PrismaPromise<{ count: number }>
}

async function main() {
  logger.info(`Running in ${DRY_RUN ? 'DRY RUN' : 'LIVE'} mode`)

  // Children before parents, so the real delete pass never hits a foreign-key violation.
  const models: { name: string; delegate: DeletableDelegate }[] = [
    { name: 'education', delegate: prisma.education },
    { name: 'workExperience', delegate: prisma.workExperience },
    { name: 'certification', delegate: prisma.certification },
    { name: 'project', delegate: prisma.project },
    { name: 'language', delegate: prisma.language },
    { name: 'userPreference', delegate: prisma.userPreference },
    { name: 'jobDescriptionSection', delegate: prisma.jobDescriptionSection },
    { name: 'interaction', delegate: prisma.interaction },
    { name: 'skillGapRecord', delegate: prisma.skillGapRecord },
    { name: 'matchInsight', delegate: prisma.matchInsight },
    { name: 'savedJob', delegate: prisma.savedJob },
    { name: 'savedCourse', delegate: prisma.savedCourse },
    { name: 'userSkill', delegate: prisma.userSkill },
    { name: 'userProfile', delegate: prisma.userProfile },
    { name: 'job', delegate: prisma.job },
    { name: 'skill', delegate: prisma.skill },
    { name: 'user', delegate: prisma.user }
  ]

  const tableCounts: Record<string, number> = {}
  for (const { name, delegate } of models) {
    tableCounts[name] = await delegate.count()
  }

  const redisCounts: Record<string, number> = {}
  for (const pattern of REDIS_KEY_PATTERNS) {
    redisCounts[pattern] = await countRedisKeys(pattern)
  }

  logger.info({ tableCounts, redisCounts }, 'Rows/keys that would be deleted')

  if (DRY_RUN) {
    logger.info('DRY_RUN=true — nothing was deleted. Re-run with DRY_RUN=false to actually delete.')
    return
  }

  await prisma.$transaction(models.map(({ delegate }) => delegate.deleteMany({})))

  let totalRedisDeleted = 0
  for (const pattern of REDIS_KEY_PATTERNS) {
    totalRedisDeleted += await deleteRedisKeys(pattern)
  }

  logger.info({ tableCounts, redisKeysDeleted: totalRedisDeleted }, 'Reset complete — every table and cache key cleared')
}

main()
  .catch((error) => {
    logger.error({ error }, 'Reset failed')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await redis.quit()
  })
