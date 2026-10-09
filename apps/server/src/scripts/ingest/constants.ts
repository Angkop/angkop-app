import type { EmploymentType } from '@prisma/client'

export const JOBS_PER_SOURCE = 400
export const MAX_DESCRIPTION_LENGTH = 1500

// Arbeitnow paginates ~300+ jobs per page; RemoteOK doesn't paginate at all (one request
// returns everything it has, currently under 100). This caps how many pages of Arbeitnow
// we walk per ingest run — in practice the loop stops as soon as JOBS_PER_SOURCE is hit
// (usually 2 pages), this just bounds it if that ever stops being true.
export const MAX_ARBEITNOW_PAGES = 5

// Real public job-board APIs, no key required. We ingest into our own DB and re-serve the
// listings on apps/web's /listings pages (platform: 'angkop') for the extension to scrape —
// see ARCHITECTURE.md for why: scraping our own site carries no third-party ToS risk, while
// these APIs' own terms (link back to the original posting) are satisfied via sourceUrl.
export const USER_AGENT = 'Angkop-Thesis-Project/0.1 (educational use; github.com/angkop)'

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
