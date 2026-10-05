import type { Dispatch, SetStateAction } from 'react'
import type {
  CareerLevel,
  EmploymentType,
  LanguageProficiency,
  ParsedResumeProfile,
  SkillLevel,
  WorkSetup
} from '@angkop/shared'

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

export const EMPTY_EDUCATION: EducationEntry = {
  school: '',
  degree: '',
  fieldOfStudy: '',
  startYear: '',
  endYear: '',
  description: ''
}

export const EMPTY_EXPERIENCE: ExperienceEntry = {
  title: '',
  company: '',
  location: '',
  employmentType: undefined,
  description: '',
  startDate: '',
  endDate: '',
  current: false
}

export const EMPTY_CERTIFICATION: CertificationEntry = {
  name: '',
  issuer: '',
  issueDate: '',
  expirationDate: '',
  credentialId: '',
  credentialUrl: ''
}

export const EMPTY_PROJECT: ProjectEntry = {
  name: '',
  description: '',
  technologies: [],
  url: '',
  startDate: '',
  endDate: ''
}

export const EMPTY_LANGUAGE: LanguageEntry = { language: '', proficiency: undefined }

export const EMPTY_PREFERENCES: PreferencesEntry = {
  desiredRoles: [],
  preferredLocations: [],
  preferredJobTypes: [],
  preferredIndustries: [],
  workSetup: undefined,
  minimumSalary: '',
  maximumSalary: '',
  willingToRelocate: false,
  willingToRemote: true
}

// Same shape-mapping useProfileEditor does when loading a saved profile into form state
// (ISO dates -> month inputs, null -> empty string) — a resume import lands in exactly the
// same editable, unsaved form state, not a direct profile write.
export function profileEntriesFromParsedResume(parsed: ParsedResumeProfile) {
  return {
    headline: parsed.headline ?? '',
    about: parsed.about ?? '',
    careerLevel: parsed.careerLevel ?? ('' as const),
    location: parsed.location ?? '',
    skills: parsed.skills.map(
      (skill): ProfileSkillEntry => ({
        name: skill.name,
        category: skill.category ?? undefined,
        level: skill.level ?? undefined,
        years: skill.years ?? undefined
      })
    ),
    education:
      parsed.education.length > 0
        ? parsed.education.map(
            (entry): EducationEntry => ({
              school: entry.school,
              degree: entry.degree ?? '',
              fieldOfStudy: entry.fieldOfStudy ?? '',
              startYear: entry.startYear ? String(entry.startYear) : '',
              endYear: entry.endYear ? String(entry.endYear) : '',
              description: entry.description ?? ''
            })
          )
        : [EMPTY_EDUCATION],
    experience: parsed.experience.map(
      (entry): ExperienceEntry => ({
        title: entry.title,
        company: entry.company,
        location: entry.location ?? '',
        employmentType: entry.employmentType ?? undefined,
        description: entry.description ?? '',
        startDate: monthInputFromIso(entry.startDate),
        endDate: monthInputFromIso(entry.endDate),
        current: entry.current
      })
    ),
    certifications: parsed.certifications.map(
      (entry): CertificationEntry => ({
        name: entry.name,
        issuer: entry.issuer,
        issueDate: monthInputFromIso(entry.issueDate),
        expirationDate: monthInputFromIso(entry.expirationDate),
        credentialId: entry.credentialId ?? '',
        credentialUrl: entry.credentialUrl ?? ''
      })
    ),
    projects: parsed.projects.map(
      (entry): ProjectEntry => ({
        name: entry.name,
        description: entry.description,
        technologies: entry.technologies,
        url: entry.url ?? '',
        startDate: monthInputFromIso(entry.startDate),
        endDate: monthInputFromIso(entry.endDate)
      })
    ),
    languages: parsed.languages.map(
      (entry): LanguageEntry => ({
        language: entry.language,
        proficiency: entry.proficiency ?? undefined
      })
    )
  }
}

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
    remove: (index: number) => setState((prev) => prev.filter((_, i) => i !== index)),
    // Bulk-replace the whole list in one shot — used by the resume import flow, which has
    // no per-row context to merge into and should just overwrite with what was extracted.
    replaceAll: (items: T[]) => setState(items)
  }
}

export type ArrayHelpers<T> = ReturnType<typeof makeArrayHelpers<T>>

export type ProfileFormState = {
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

export function buildCompleteOnboardingInput(state: ProfileFormState) {
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
