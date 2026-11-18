export type DescriptionCategoryValue =
  | 'overview'
  | 'responsibilities'
  | 'requirements'
  | 'nice-to-have'
  | 'benefits'
  | 'other'

export type DescriptionCategory = {
  value: DescriptionCategoryValue
  label: string
  keywords: string[]
}

// The fixed taxonomy every listing's description is sorted into, in render order. Ingestion
// writes each section under exactly one of these labels and the listing page's accordion
// reads them back through the same keywords, so a posting's own wording ("The Gig", "Perks &
// Stuff") never decides where its text lands. `other` has no keywords: it is where anything
// that matches nothing else goes.
export const DESCRIPTION_CATEGORIES: DescriptionCategory[] = [
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
  },
  { value: 'other', label: 'Additional details', keywords: [] }
]

export function findDescriptionCategoryByHeading(heading: string | null): DescriptionCategory | null {
  if (heading === null) return DESCRIPTION_CATEGORIES[0]
  const normalized = heading.toLowerCase().replace(/[’‘]/g, "'")
  return (
    DESCRIPTION_CATEGORIES.find((category) => category.keywords.some((keyword) => normalized.includes(keyword))) ??
    null
  )
}
