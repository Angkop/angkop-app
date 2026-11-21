import type { DescriptionSection } from '@angkop/shared'
import type { EmploymentType, SalaryPeriod, WorkSetup } from '@prisma/client'

export type NormalizedListing = {
  id: string
  title: string
  company: string
  description: string
  descriptionSections: DescriptionSection[]
  requiredSkills: string[]
  sourceName: string
  sourceUrl: string
  location: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  salaryPeriod: SalaryPeriod | null
  workSetup: WorkSetup | null
  employmentType: EmploymentType | null
}

export type SourceFetchResult = {
  listings: NormalizedListing[]
  // True only when the source's whole current feed was read — every page, nothing cut off by
  // a cap. Only then is a listing missing from `listings` really gone from the source, which
  // is what lets the ingest remove stale jobs. A source that throws is a failed source,
  // never an empty one.
  complete: boolean
  // True when the feed stopped short because of a limit we set on purpose (JOBS_PER_SOURCE, or
  // the few hundred Headcount Labs postings we read), not because a request failed. A capped
  // feed can't be used to remove stale jobs, but that is expected, so it is not a problem.
  // An incomplete feed that is not capped lost pages to a failure and is reported as partial.
  capped: boolean
}
