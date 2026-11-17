import type { EmploymentType, WorkSetup } from '@prisma/client'

export const JOBS_PER_SOURCE = 2000
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
