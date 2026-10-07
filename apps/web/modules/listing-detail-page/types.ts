import type { DescriptionSection, EmploymentType, WorkSetup } from '@angkop/shared'

export type ListingDetail = {
  id: string
  platformJobId: string
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
  workSetup: WorkSetup | null
  employmentType: EmploymentType | null
  detectedLanguage: string | null
  mentionedLanguages: string[]
}
