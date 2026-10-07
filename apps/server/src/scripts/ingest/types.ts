import type { DescriptionSection } from '@angkop/shared'
import type { EmploymentType, WorkSetup } from '@prisma/client'

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
  workSetup: WorkSetup | null
  employmentType: EmploymentType | null
}
