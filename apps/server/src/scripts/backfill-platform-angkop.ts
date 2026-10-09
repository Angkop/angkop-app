// One-off: renames the stored platform value 'demo' -> 'angkop' on existing Job and
// Interaction rows. Pure string update, no schema change, no deletes.
//
// Run: tsx src/scripts/backfill-platform-angkop.ts          (dry run — counts only)
//      DRY_RUN=false tsx src/scripts/backfill-platform-angkop.ts   (actually updates)
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger'

const prisma = new PrismaClient()
const DRY_RUN = process.env.DRY_RUN !== 'false'

async function main() {
  logger.info(`Running in ${DRY_RUN ? 'DRY RUN' : 'LIVE'} mode`)

  const [jobCount, interactionCount] = await Promise.all([
    prisma.job.count({ where: { platform: 'demo' } }),
    prisma.interaction.count({ where: { platform: 'demo' } })
  ])

  logger.info({ jobCount, interactionCount }, "Rows with platform='demo' that would be renamed to 'angkop'")

  if (DRY_RUN) {
    logger.info('DRY_RUN=true — nothing was changed. Re-run with DRY_RUN=false to actually update.')
    return
  }

  const [jobResult, interactionResult] = await prisma.$transaction([
    prisma.job.updateMany({ where: { platform: 'demo' }, data: { platform: 'angkop' } }),
    prisma.interaction.updateMany({ where: { platform: 'demo' }, data: { platform: 'angkop' } })
  ])

  logger.info(
    { jobsUpdated: jobResult.count, interactionsUpdated: interactionResult.count },
    "Backfill complete — every 'demo' row now reads 'angkop'"
  )
}

main()
  .catch((error) => {
    logger.error({ error }, 'Backfill failed')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
