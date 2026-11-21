import { prisma } from './prisma'
import { createTtlCache } from './ttl-cache'

export type CatalogJob = {
  id: string
  title: string
  company: string
  requiredSkills: string[]
}

// Jobs change when the nightly ingest runs, not between one feed page and the next, but every
// page change, search and filter used to re-read the whole catalog (about 2,100 rows and growing)
// from Postgres. A job the ingest removed can linger here for up to this long; the page's rows
// are loaded fresh afterwards with `deleted: false` (see hydrateJobMatches), so it is dropped
// from the page instead of being shown.
const JOB_CATALOG_TTL_MS = 60_000

// Every live job's ranking fields, in id order. Shared between requests, so callers must not
// change what they get back (hence readonly).
export const getJobCatalog: () => Promise<readonly CatalogJob[]> = createTtlCache(
  () =>
    prisma.job.findMany({
      where: { deleted: false },
      select: { id: true, title: true, company: true, requiredSkills: true },
      // Without a tiebreaker, equal scores come back in whatever order Postgres returns them,
      // so a job could appear on two pages (or none) as the user pages through.
      orderBy: { id: 'asc' }
    }),
  JOB_CATALOG_TTL_MS
)
