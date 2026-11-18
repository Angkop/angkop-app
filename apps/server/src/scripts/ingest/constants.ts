import type { EmploymentType, WorkSetup } from '@prisma/client'

export const JOBS_PER_SOURCE = 2000

// Nightly run (see ingest-jobs-service.ts): how many NEW listings each bucket brings in.
// International is RemoteOK + Arbeitnow, split between them; PH is Headcount Labs. Listings
// already in the database never count toward these.
export const DAILY_NEW_JOBS_INTERNATIONAL = 25
export const DAILY_NEW_JOBS_PH = 25

// Every request to a source gets this long before it counts as that source failing.
export const FETCH_TIMEOUT_MS = 30_000

// Overlap guard: a Redis key held for the length of a run. The TTL only matters if a run
// dies without releasing it, so it is set well past how long a real run takes.
export const INGEST_LOCK_KEY = 'ingest:jobs:lock'
export const INGEST_LOCK_TTL_SECONDS = 60 * 60 * 2

// A source whose feed comes back with fewer listings than this looks broken (an outage page,
// a changed response shape) rather than genuinely empty, so it is never used to decide
// which stored jobs have disappeared.
export const STALE_MIN_FEED_SIZE = 20

// Stop a bucket after this many embedding/write failures in a row — the ML service is almost
// certainly down, and walking every remaining candidate would just fail each one slowly.
export const MAX_CONSECUTIVE_FAILURES = 5

// Headcount Labs ids are stored as `${HEADCOUNTLABS_ID_PREFIX}<their job_id>`.
export const HEADCOUNTLABS_ID_PREFIX = 'angkop-headcountlabs-'

// Stale check for Headcount Labs: one request per stored posting (1 per second), so each run
// only checks this many, oldest-checked first, and the rest rotate in on later nights. A live
// posting costs one record of the 100,000/month allowance; an expired one costs none.
export const HEADCOUNTLABS_STALE_CHECKS_PER_RUN = 300
// Redis sorted set of posting id -> when it was last checked, used to pick who goes next.
export const HEADCOUNTLABS_LAST_CHECKED_KEY = 'ingest:headcountlabs:last-checked'
export const MAX_DESCRIPTION_LENGTH = 1500

// Arbeitnow's first two pages run ~325 jobs each, then it settles to ~100/page; RemoteOK
// doesn't paginate at all (one request returns everything it has, currently under 100).
// This caps how many pages of Arbeitnow we walk per ingest run — in practice the loop
// stops as soon as JOBS_PER_SOURCE is hit or the API's `next` link runs out, this just
// bounds it if that ever stops being true.
export const MAX_ARBEITNOW_PAGES = 20

// Real public job-board APIs, no key required. We ingest into our own DB and re-serve the
// listings on apps/web's /listings pages (platform: 'angkop') for the extension to scrape —
// see ARCHITECTURE.md for why: scraping our own site carries no third-party ToS risk, while
// these APIs' own terms (link back to the original posting) are satisfied via sourceUrl.
export const USER_AGENT = 'Angkop-Thesis-Project/0.1 (educational use; github.com/angkop)'

// Headcount Labs (keyed API, Philippine listings only — see plans/add-ph-job-sources.md).
// Every job returned costs one record against a 100,000/month free allowance, so this is
// deliberately small for now. It must stay a multiple of HEADCOUNTLABS_PAGE_SIZE: their docs
// require the same page size on every request of one cursor walk, so we always ask for full
// pages and trim afterwards instead of shrinking the last page's limit.
export const HEADCOUNTLABS_MAX_JOBS = 300
export const HEADCOUNTLABS_PAGE_SIZE = 100
// Free tier allows 1 request per second across the whole account.
export const HEADCOUNTLABS_REQUEST_INTERVAL_MS = 1100

// Headcount Labs' `work_arrangement` values we can compare directly. Anything else
// (`source_unmapped`, `source_omitted`, values we haven't seen) stays null.
export const HEADCOUNTLABS_WORK_SETUP_MAP: Record<string, WorkSetup> = {
  in_person: 'ONSITE',
  hybrid: 'HYBRID',
  remote: 'REMOTE'
}

// Maps Arbeitnow's free-text job_types to our EmploymentType enum (the same enum
// UserPreference.preferredJobTypes uses) so the two sides can be compared directly.
// Unrecognized values stay null rather than being guessed at.
export const EMPLOYMENT_TYPE_MAP: Record<string, EmploymentType> = {
  'full-time': 'FULL_TIME',
  'full time': 'FULL_TIME',
  'part-time': 'PART_TIME',
  'part time': 'PART_TIME',
  contract: 'CONTRACT',
  contractor: 'CONTRACT',
  internship: 'INTERNSHIP',
  intern: 'INTERNSHIP',
  freelance: 'FREELANCE'
}
