import { DESCRIPTION_CATEGORIES, SALARY_PERIOD_SUFFIXES, findDescriptionCategoryByHeading } from '@angkop/shared'
import type { DescriptionCategory, SalaryPeriod } from '@angkop/shared'
import type { ListingDetail } from './types'

// Rows ingested before salaryCurrency/salaryPeriod existed carry neither, and every one of
// them came from RemoteOK, which quotes USD per year — so null falls back to that.
const LEGACY_SALARY_CURRENCY = 'USD'
const LEGACY_SALARY_PERIOD: SalaryPeriod = 'YEARLY'

export function formatSalaryRange(
  listing: Pick<ListingDetail, 'salaryMin' | 'salaryMax' | 'salaryCurrency' | 'salaryPeriod'>
): string | null {
  const { salaryMin, salaryMax } = listing
  if (salaryMin === null && salaryMax === null) return null
  const isLegacyRow = listing.salaryCurrency === null && listing.salaryPeriod === null
  const currency = listing.salaryCurrency ?? LEGACY_SALARY_CURRENCY
  const period = isLegacyRow ? LEGACY_SALARY_PERIOD : listing.salaryPeriod
  const format = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
  const suffix = period ? SALARY_PERIOD_SUFFIXES[period] : ''
  if (salaryMin !== null && salaryMax !== null) return `${format(salaryMin)} - ${format(salaryMax)}${suffix}`
  return `${format(salaryMin ?? salaryMax ?? 0)}${suffix}`
}

export type GroupedDescriptionSection = {
  value: string
  label: string
  items: string[]
}

// Sources write their own heading wording ("What You'll Bring", "The Gig", "Perks & Stuff"),
// so two listings never land on the same labels. Ingestion already files each section under
// one of the fixed categories in @angkop/shared (same order, same labels, on every listing),
// and this re-sorts by the same keywords so older rows that were stored with their raw
// headings group the same way. Every category always renders, even with nothing in it — a
// category that's unexpectedly missing (parsing failed, or this source just never mentions
// it) should look different from one a reader never thought to look for, not be silently
// absent.
const OTHER_CATEGORY = DESCRIPTION_CATEGORIES[DESCRIPTION_CATEGORIES.length - 1]

function categoryForHeading(heading: string | null): DescriptionCategory {
  return findDescriptionCategoryByHeading(heading) ?? OTHER_CATEGORY
}

export function groupDescriptionSections(sections: ListingDetail['descriptionSections']): GroupedDescriptionSection[] {
  const itemsByCategory = new Map<string, GroupedDescriptionSection>()

  for (const section of sections) {
    const category = categoryForHeading(section.heading)
    const existing = itemsByCategory.get(category.value)
    if (existing) {
      existing.items.push(...section.items)
    } else {
      itemsByCategory.set(category.value, { value: category.value, label: category.label, items: [...section.items] })
    }
  }

  return DESCRIPTION_CATEGORIES.map(
    (category) => itemsByCategory.get(category.value) ?? { value: category.value, label: category.label, items: [] }
  )
}
