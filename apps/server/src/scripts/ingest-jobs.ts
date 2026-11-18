// Nightly job refresh: removes listings their source no longer lists, then ingests the daily
// quota of new ones (see ingest/ingest-jobs-service.ts). Run by .github/workflows/ingest-jobs.yml
// at 11:30pm PHT, and by hand with:
//
//   pnpm ingest:jobs                      one real run
//   pnpm ingest:jobs --dry-run            fetch and report only — no writes, no embeddings
//   pnpm ingest:jobs --source=remoteok    one source only (remoteok | arbeitnow | headcountlabs)
//   pnpm ingest:jobs --full               ignore the daily caps (backfill)
//
// INGEST_DRY_RUN=true is the same as --dry-run; INGEST_ENABLED=false turns the run off.
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger'
import { embed } from '../lib/ml-client'
import { redis } from '../lib/redis'
import { IngestJobsService, SOURCE_NAMES } from './ingest/ingest-jobs-service'

const prisma = new PrismaClient()

const onlySource = process.argv.find((arg) => arg.startsWith('--source='))?.slice('--source='.length)
const dryRun = process.argv.includes('--dry-run') || process.env.INGEST_DRY_RUN === 'true'
const full = process.argv.includes('--full')

async function main() {
  if (process.env.INGEST_ENABLED === 'false') {
    logger.warn('Job ingest is turned off (INGEST_ENABLED=false)')
    return
  }
  if (onlySource && !SOURCE_NAMES.includes(onlySource)) {
    logger.error(`Unknown --source "${onlySource}". Use one of: ${SOURCE_NAMES.join(', ')}`)
    process.exitCode = 1
    return
  }

  const service = new IngestJobsService({
    prisma,
    redis,
    logger,
    embed,
    webUrl: process.env.WEB_URL ?? 'http://localhost:3000'
  })
  const { status } = await service.execute({ dryRun, onlySource, full })
  // A skipped run (another one holds the lock) is not a failure; anything that went wrong is,
  // so the workflow run shows up red.
  if (status === 'failed' || status === 'partial') process.exitCode = 1
}

main()
  .catch((error) => {
    logger.error({ error }, 'Ingest crashed')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    redis.disconnect()
  })
