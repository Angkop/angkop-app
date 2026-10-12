import type { ListingDetail } from './types'

export function formatSalaryRange(salaryMin: number | null, salaryMax: number | null): string | null {
  if (salaryMin === null && salaryMax === null) return null
  const format = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
  if (salaryMin !== null && salaryMax !== null) return `${format(salaryMin)} - ${format(salaryMax)}/yr`
  return `${format(salaryMin ?? salaryMax ?? 0)}/yr`
}

export type GroupedDescriptionSection = {
  value: string
  label: string
  items: string[]
}

// Sources write their own heading wording ("What You'll Bring", "The Gig", "Perks & Stuff"),
// so two listings never land on the same labels — which makes a per-job accordion feel
// arbitrary rather than scannable. This sorts every raw heading into one fixed taxonomy
// (same order, same labels, on every listing) so a reader can learn the shape once and
// then skim any posting the same way. A listing that's missing a category just skips it —
// never shown empty.
const CATEGORIES: { value: string; label: string; keywords: string[] }[] = [
  {
    value: 'overview',
    label: 'Overview',
    keywords: ['overview', 'about the role', 'about the company', 'about us', 'who we are', 'the role', 'summary']
  },
  {
    value: 'responsibilities',
    label: 'Responsibilities',
    keywords: ['responsibilit', "what you'll do", 'what you will do', 'duties', 'day-to-day', 'day to day', 'key tasks']
  },
  {
    value: 'requirements',
    label: 'Requirements',
    keywords: [
      'requirement',
      'qualification',
      'must have',
      'must-have',
      "what you'll bring",
      'what you bring',
      'what we need',
      'looking for',
      'skills'
    ]
  },
  {
    value: 'nice-to-have',
    label: 'Nice to have',
    keywords: ['nice to have', 'nice-to-have', 'preferred', 'bonus', 'good to have', 'a plus', 'desirable']
  },
  {
    value: 'benefits',
    label: 'Benefits',
    keywords: ['benefit', 'perk', 'what we offer', 'compensation', 'why join', "what's in it"]
  }
]
const OTHER_CATEGORY = { value: 'other', label: 'Additional details' }

function categoryForHeading(heading: string | null): { value: string; label: string } {
  if (heading === null) return CATEGORIES[0]
  const normalized = heading.toLowerCase()
  const match = CATEGORIES.find((category) => category.keywords.some((keyword) => normalized.includes(keyword)))
  return match ?? OTHER_CATEGORY
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

  const order = [...CATEGORIES, OTHER_CATEGORY].map((category) => category.value)
  return order
    .map((value) => itemsByCategory.get(value))
    .filter((group): group is GroupedDescriptionSection => group !== undefined && group.items.length > 0)
}
