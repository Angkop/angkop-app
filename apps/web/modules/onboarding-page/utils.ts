import type { Dispatch, SetStateAction } from 'react'
import type { CareerLevel } from '@angkop/shared'
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  PreferencesEntry,
  ProfileSkillEntry,
  ProjectEntry
} from '@/lib/onboarding-profile'

export function monthInputFromIso(iso: string | null): string {
  return iso ? iso.slice(0, 7) : ''
}

export function isoFromMonthInput(month: string): string | null {
  return month ? `${month}-01` : null
}

export function makeArrayHelpers<T>(setState: Dispatch<SetStateAction<T[]>>, empty: T) {
  return {
    update: <K extends keyof T>(index: number, field: K, value: T[K]) =>
      setState((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))),
    add: () => setState((prev) => [...prev, empty]),
    remove: (index: number) => setState((prev) => prev.filter((_, i) => i !== index))
  }
}

export type ArrayHelpers<T> = ReturnType<typeof makeArrayHelpers<T>>

export type OnboardingWizardState = {
  headline: string
  about: string
  location: string
  careerLevel: CareerLevel | ''
  resumeFileName: string
  skills: ProfileSkillEntry[]
  education: EducationEntry[]
  experience: ExperienceEntry[]
  certifications: CertificationEntry[]
  projects: ProjectEntry[]
  languages: LanguageEntry[]
  preferences: PreferencesEntry
}

export function buildCompleteOnboardingInput(state: OnboardingWizardState) {
  const { headline, about, location, careerLevel, resumeFileName, skills, education, experience, certifications, projects, languages, preferences } =
    state

  return {
    headline: headline || null,
    about: about || null,
    location: location || null,
    careerLevel: careerLevel || null,
    resumeFileName: resumeFileName || null,
    skills: skills
      .filter((skill) => skill.name.trim().length > 0)
      .map((skill) => ({
        name: skill.name,
        category: skill.category || null,
        level: skill.level ?? null,
        years: skill.years ?? null
      })),
    education: education
      .filter((entry) => entry.school.trim().length > 0)
      .map((entry) => ({
        school: entry.school,
        degree: entry.degree || null,
        fieldOfStudy: entry.fieldOfStudy || null,
        startYear: entry.startYear ? Number(entry.startYear) : null,
        endYear: entry.endYear ? Number(entry.endYear) : null,
        description: entry.description || null
      })),
    experience: experience
      .filter((entry) => entry.title.trim().length > 0 && entry.company.trim().length > 0 && entry.startDate)
      .map((entry) => ({
        title: entry.title,
        company: entry.company,
        location: entry.location || null,
        employmentType: entry.employmentType ?? null,
        description: entry.description || null,
        startDate: isoFromMonthInput(entry.startDate)!,
        endDate: entry.current ? null : isoFromMonthInput(entry.endDate),
        current: entry.current
      })),
    certifications: certifications
      .filter((entry) => entry.name.trim().length > 0 && entry.issuer.trim().length > 0)
      .map((entry) => ({
        name: entry.name,
        issuer: entry.issuer,
        issueDate: isoFromMonthInput(entry.issueDate),
        expirationDate: isoFromMonthInput(entry.expirationDate),
        credentialId: entry.credentialId || null,
        credentialUrl: entry.credentialUrl || null
      })),
    projects: projects
      .filter((entry) => entry.name.trim().length > 0 && entry.description.trim().length > 0)
      .map((entry) => ({
        name: entry.name,
        description: entry.description,
        technologies: entry.technologies,
        url: entry.url || null,
        startDate: isoFromMonthInput(entry.startDate),
        endDate: isoFromMonthInput(entry.endDate)
      })),
    languages: languages
      .filter((entry) => entry.language.trim().length > 0)
      .map((entry) => ({ language: entry.language, proficiency: entry.proficiency ?? null })),
    preferences: {
      desiredRoles: preferences.desiredRoles,
      preferredLocations: preferences.preferredLocations,
      preferredJobTypes: preferences.preferredJobTypes,
      preferredIndustries: preferences.preferredIndustries,
      workSetup: preferences.workSetup ?? null,
      minimumSalary: preferences.minimumSalary ? Number(preferences.minimumSalary) : null,
      maximumSalary: preferences.maximumSalary ? Number(preferences.maximumSalary) : null,
      willingToRelocate: preferences.willingToRelocate,
      willingToRemote: preferences.willingToRemote
    }
  }
}
