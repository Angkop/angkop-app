// Read-only: shows logged interactions — the actual signal NCF trains on and the same
// count that drives collaborativeWeight in the hybrid score blend.
//
// Run: npx tsx src/scripts/inspect-user-interactions.ts              (every user)
//      npx tsx src/scripts/inspect-user-interactions.ts <email-or-userId>   (one user)
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger'

const prisma = new PrismaClient()

// Mirrors ml/app/config.py's COLLABORATIVE_WEIGHT_* + recommendations.py's
// _collaborative_weight — duplicated here only to show what the live service would compute
// for this interaction count, not to make scoring decisions.
const COLLABORATIVE_WEIGHT_FLOOR = 0.1
const COLLABORATIVE_WEIGHT_CEILING = 0.6
const COLLABORATIVE_WEIGHT_STEP_PER_INTERACTION = 0.05

function collaborativeWeightFor(interactionCount: number): number {
  const weight = COLLABORATIVE_WEIGHT_FLOOR + COLLABORATIVE_WEIGHT_STEP_PER_INTERACTION * interactionCount
  return Math.min(weight, COLLABORATIVE_WEIGHT_CEILING)
}

async function inspectUser(userId: string, label: string) {
  const interactions = await prisma.interaction.findMany({
    where: { userId, deleted: false },
    include: { job: { select: { title: true, company: true } } },
    orderBy: { createdAt: 'desc' }
  })

  const countsByEventType: Record<string, number> = {}
  const pointsByEventType: Record<string, number> = {}
  let totalPoints = 0
  for (const interaction of interactions) {
    countsByEventType[interaction.eventType] = (countsByEventType[interaction.eventType] ?? 0) + 1
    pointsByEventType[interaction.eventType] = (pointsByEventType[interaction.eventType] ?? 0) + interaction.weight
    totalPoints += interaction.weight
  }

  const interactionCount = interactions.length
  const collaborativeWeight = collaborativeWeightFor(interactionCount)

  logger.info(
    { interactionCount, totalPoints, countsByEventType, pointsByEventType, collaborativeWeight },
    `${label} — interaction summary (collaborativeWeight is what the hybrid score blend would use right now)`
  )

  if (interactions.length === 0) {
    logger.info(`${label} — no interactions logged yet`)
    return
  }

  logger.info(`${label} — full log (${interactions.length} rows, newest first):`)
  for (const interaction of interactions) {
    const jobLabel = interaction.job ? `${interaction.job.title} @ ${interaction.job.company}` : interaction.jobId
    logger.info(
      `${interaction.createdAt.toISOString()}  ${interaction.eventType.padEnd(8)} points=${interaction.weight}  ${interaction.platform.padEnd(10)}  ${jobLabel}`
    )
  }
}

async function main() {
  const identifier = process.argv[2]

  if (identifier) {
    const user = await prisma.user.findFirst({
      where: identifier.includes('@') ? { email: identifier, deleted: false } : { id: identifier, deleted: false }
    })
    if (!user) {
      logger.error(`No user found for "${identifier}"`)
      process.exitCode = 1
      return
    }
    logger.info({ id: user.id, email: user.email, name: user.name }, 'User')
    await inspectUser(user.id, user.email)
    return
  }

  const users = await prisma.user.findMany({ where: { deleted: false }, orderBy: { createdAt: 'asc' } })
  logger.info(`No identifier given — inspecting all ${users.length} user(s)`)
  for (const user of users) {
    logger.info({ id: user.id, email: user.email, name: user.name }, 'User')
    await inspectUser(user.id, user.email)
  }
}

main()
  .catch((error) => {
    logger.error({ error }, 'Inspection failed')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
