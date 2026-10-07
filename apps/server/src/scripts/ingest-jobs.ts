import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger'
import { embed } from '../lib/ml-client'
import { detectLanguage } from './ingest/posting-language'
import { fetchArbeitnow } from './ingest/sources/arbeitnow'
import { fetchRemoteOk } from './ingest/sources/remoteok'

const prisma = new PrismaClient()
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000'

async function main() {
  const [remoteOk, arbeitnow] = await Promise.all([fetchRemoteOk(), fetchArbeitnow()])
  const listings = [...remoteOk, ...arbeitnow]

  if (listings.length === 0) {
    logger.warn('No listings fetched from any source — nothing to ingest. Check network access.')
    return
  }

  logger.info(`Ingesting ${listings.length} real listings (${remoteOk.length} RemoteOK, ${arbeitnow.length} Arbeitnow)...`)

  for (const listing of listings) {
    const [{ embedding }, detectedLanguage] = await Promise.all([
      embed({ text: `${listing.title}. ${listing.description}` }),
      detectLanguage(listing.description)
    ])
    const fields = {
      title: listing.title,
      company: listing.company,
      description: listing.description,
      detectedLanguage,
      requiredSkills: listing.requiredSkills,
      url: `${WEB_URL}/listings/${listing.id}`,
      sourceName: listing.sourceName,
      sourceUrl: listing.sourceUrl,
      location: listing.location,
      salaryMin: listing.salaryMin,
      salaryMax: listing.salaryMax,
      workSetup: listing.workSetup,
      employmentType: listing.employmentType,
      embedding
    }
    await prisma.job.upsert({
      where: { platform_platformJobId: { platform: 'demo', platformJobId: listing.id } },
      update: fields,
      create: {
        id: listing.id,
        platformJobId: listing.id,
        platform: 'demo',
        ...fields
      }
    })

    // Upsert each section by its position, so a re-ingest of the same listing updates
    // existing rows in place instead of duplicating them. If this run has fewer sections
    // than exist in the DB (the source trimmed content), the extra trailing ones are
    // stale — soft-deleted rather than hard-deleted, same as everywhere else in this schema.
    // Sequential, not Promise.all: Supabase's pooler caps concurrent connections at 15,
    // and a burst of per-section upserts across many listings blew past that.
    for (const [order, section] of listing.descriptionSections.entries()) {
      await prisma.jobDescriptionSection.upsert({
        where: { jobId_order: { jobId: listing.id, order } },
        update: { heading: section.heading, items: section.items, deleted: false },
        create: { jobId: listing.id, order, heading: section.heading, items: section.items }
      })
    }
    await prisma.jobDescriptionSection.updateMany({
      where: { jobId: listing.id, order: { gte: listing.descriptionSections.length }, deleted: false },
      data: { deleted: true }
    })
  }

  logger.info('Ingest complete. Visit /listings on the dashboard to browse them.')
}

main()
  .catch((error) => {
    logger.error({ error }, 'Ingest failed')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
