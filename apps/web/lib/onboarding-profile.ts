import type { CareerLevel, EmploymentType, LanguageProficiency, SkillLevel, WorkSetup } from '@angkop/shared'

export type ProfileSkillEntry = {
  name: string
  category?: string
  level?: SkillLevel
  years?: number
}

export type EducationEntry = {
  school: string
  degree: string
  fieldOfStudy: string
  startYear: string
  endYear: string
  description: string
}

export type ExperienceEntry = {
  title: string
  company: string
  location: string
  employmentType?: EmploymentType
  description: string
  startDate: string
  endDate: string
  current: boolean
}

export type CertificationEntry = {
  name: string
  issuer: string
  issueDate: string
  expirationDate: string
  credentialId: string
  credentialUrl: string
}

export type ProjectEntry = {
  name: string
  description: string
  technologies: string[]
  url: string
  startDate: string
  endDate: string
}

export type LanguageEntry = {
  language: string
  proficiency?: LanguageProficiency
}

export type PreferencesEntry = {
  desiredRoles: string[]
  preferredLocations: string[]
  preferredJobTypes: EmploymentType[]
  preferredIndustries: string[]
  workSetup?: WorkSetup
  minimumSalary: string
  maximumSalary: string
  willingToRelocate: boolean
  willingToRemote: boolean
}

export type OnboardingProfile = {
  headline: string
  about: string
  careerLevel?: CareerLevel
  location: string
  skills: ProfileSkillEntry[]
  education: EducationEntry[]
  experience: ExperienceEntry[]
  certifications: CertificationEntry[]
  projects: ProjectEntry[]
  languages: LanguageEntry[]
  preferences: PreferencesEntry
  resumeFileName: string
}
