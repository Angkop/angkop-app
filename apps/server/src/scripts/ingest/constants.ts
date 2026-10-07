import type { EmploymentType } from '@prisma/client'

export const JOBS_PER_SOURCE = 50
export const MAX_DESCRIPTION_LENGTH = 1500

// Real public job-board APIs, no key required. We ingest into our own DB and re-serve the
// listings on apps/web's /listings pages (platform: 'demo') for the extension to scrape —
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
