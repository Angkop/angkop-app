import type { CareerLevel, EmploymentType, LanguageProficiency, SkillLevel, WorkSetup } from '@angkop/shared'

export type GraphQLContext = {
  userId: string
}

export type SavedJobWithJob = {
  id: number
  jobId: string
  job: {
    id: string
    platformJobId: string
    platform: string
    title: string
    company: string
    description: string
    requiredSkills: string[]
    url: string
  }
  status: string
  tags: string[]
  interviewDate: Date | null
  createdAt: Date
}

export type ProfileSkillInput = {
  name: string
  category?: string | null
  level?: SkillLevel | null
  years?: number | null
}

export type EducationInput = {
  school: string
  degree?: string | null
  fieldOfStudy?: string | null
  startYear?: number | null
  endYear?: number | null
  description?: string | null
}

export type WorkExperienceInput = {
  title: string
  company: string
  location?: string | null
  employmentType?: EmploymentType | null
  description?: string | null
  startDate: string
  endDate?: string | null
  current?: boolean | null
}

export type CertificationInput = {
  name: string
  issuer: string
  issueDate?: string | null
  expirationDate?: string | null
  credentialId?: string | null
  credentialUrl?: string | null
}

export type ProjectInput = {
  name: string
  description: string
  technologies: string[]
  url?: string | null
  startDate?: string | null
  endDate?: string | null
}

export type LanguageInput = {
  language: string
  proficiency?: LanguageProficiency | null
}

export type UserPreferenceInput = {
  desiredRoles: string[]
  preferredLocations: string[]
  preferredJobTypes: EmploymentType[]
  preferredIndustries: string[]
  workSetup?: WorkSetup | null
  minimumSalary?: number | null
  maximumSalary?: number | null
  willingToRelocate: boolean
  willingToRemote: boolean
}

export type CompleteOnboardingInput = {
  headline?: string | null
  about?: string | null
  location?: string | null
  careerLevel?: CareerLevel | null
  resumeFileName?: string | null
  skills: ProfileSkillInput[]
  education: EducationInput[]
  experience: WorkExperienceInput[]
  certifications: CertificationInput[]
  projects: ProjectInput[]
  languages: LanguageInput[]
  preferences: UserPreferenceInput
}
