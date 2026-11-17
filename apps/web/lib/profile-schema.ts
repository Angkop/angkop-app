import { z } from 'zod'
import {
  CAREER_LEVEL_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  LANGUAGE_PROFICIENCY_LABELS,
  SKILL_LEVEL_LABELS,
  WORK_SETUP_LABELS
} from '@angkop/shared'
import type { ProfileFormValues } from '@/lib/profile-form'

type RowIssue = { path: string; message: string }

function enumFromLabels<T extends string>(labels: Record<T, string>, message: string) {
  return z.enum(Object.keys(labels) as [T, ...T[]], { error: message })
}

const careerLevelSchema = enumFromLabels(CAREER_LEVEL_LABELS, 'Select where you are in your career')
const employmentTypeSchema = enumFromLabels(EMPLOYMENT_TYPE_LABELS, 'Select an employment type')
const workSetupSchema = enumFromLabels(WORK_SETUP_LABELS, 'Select a work setup')
const skillLevelSchema = enumFromLabels(SKILL_LEVEL_LABELS, 'Select a skill level')
const languageProficiencySchema = enumFromLabels(LANGUAGE_PROFICIENCY_LABELS, 'Select a proficiency')

// Rows start out empty and the form drops rows that stay empty on save, so an untouched
// row is fine. The moment any field in a row has something in it, its required fields do.
function isBlankRow(row: object): boolean {
  return Object.values(row).every(
    (value) => value === '' || value === undefined || value === false || (Array.isArray(value) && value.length === 0)
  )
}

function missingWhenFilled<T extends object>(row: T, required: [keyof T & string, string][]): RowIssue[] {
  if (isBlankRow(row)) return []
  return required
    .filter(([key]) => String(row[key] ?? '').trim() === '')
    .map(([path, message]) => ({ path, message }))
}

function yearIssues(row: { startYear: string; endYear: string }): RowIssue[] {
  const isYear = (value: string) => /^\d{4}$/.test(value)
  const issues: RowIssue[] = []
  if (row.startYear && !isYear(row.startYear)) {
    issues.push({ path: 'startYear', message: 'Enter a four-digit year, like 2022' })
  }
  if (row.endYear && !isYear(row.endYear)) {
    issues.push({ path: 'endYear', message: 'Enter a four-digit year, like 2026' })
  }
  if (issues.length === 0 && row.startYear && row.endYear && row.endYear < row.startYear) {
    issues.push({ path: 'endYear', message: "End year can't be before the start year" })
  }
  return issues
}

// Month inputs hold YYYY-MM, which sorts the same as the dates it stands for.
function monthRangeIssues(startDate: string, endDate: string, endPath: string): RowIssue[] {
  if (startDate && endDate && endDate < startDate) {
    return [{ path: endPath, message: "End date can't be before the start date" }]
  }
  return []
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

function urlIssues(value: string, path: string): RowIssue[] {
  if (value && !isHttpUrl(value)) return [{ path, message: 'Enter a full link starting with https://' }]
  return []
}

function salaryIssues(preferences: { minimumSalary: string; maximumSalary: string }): RowIssue[] {
  const isSalary = (value: string) => Number.isFinite(Number(value)) && Number(value) >= 0
  const { minimumSalary, maximumSalary } = preferences
  const issues: RowIssue[] = []
  if (minimumSalary && !isSalary(minimumSalary)) {
    issues.push({ path: 'minimumSalary', message: 'Enter a salary of 0 or more' })
  }
  if (maximumSalary && !isSalary(maximumSalary)) {
    issues.push({ path: 'maximumSalary', message: 'Enter a salary of 0 or more' })
  }
  if (issues.length === 0 && minimumSalary && maximumSalary && Number(maximumSalary) < Number(minimumSalary)) {
    issues.push({ path: 'maximumSalary', message: "Maximum salary can't be lower than the minimum" })
  }
  return issues
}

function withIssues<S extends z.ZodType>(schema: S, findIssues: (value: z.output<S>) => RowIssue[]): S {
  return schema.superRefine((value, ctx) => {
    for (const { path, message } of findIssues(value)) {
      ctx.addIssue({ code: 'custom', path: [path], message })
    }
  })
}

const skillSchema = z.object({
  name: z.string(),
  category: z.string().optional(),
  level: skillLevelSchema.optional(),
  years: z.number({ error: 'Enter years as a number' }).min(0, 'Enter years as 0 or more').optional()
})

const educationSchema = withIssues(
  z.object({
    school: z.string(),
    degree: z.string(),
    fieldOfStudy: z.string(),
    startYear: z.string(),
    endYear: z.string(),
    description: z.string()
  }),
  (row) => [...missingWhenFilled(row, [['school', 'Add a school name']]), ...yearIssues(row)]
)

const experienceSchema = withIssues(
  z.object({
    title: z.string(),
    company: z.string(),
    location: z.string(),
    employmentType: employmentTypeSchema.optional(),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    current: z.boolean()
  }),
  (row) => [
    ...missingWhenFilled(row, [
      ['title', 'Add a job title'],
      ['company', 'Add a company name'],
      ['startDate', 'Add a start date']
    ]),
    ...(row.current ? [] : monthRangeIssues(row.startDate, row.endDate, 'endDate'))
  ]
)

const certificationSchema = withIssues(
  z.object({
    name: z.string(),
    issuer: z.string(),
    issueDate: z.string(),
    expirationDate: z.string(),
    credentialId: z.string(),
    credentialUrl: z.string()
  }),
  (row) => [
    ...missingWhenFilled(row, [
      ['name', 'Add a certification name'],
      ['issuer', 'Add the issuer']
    ]),
    ...monthRangeIssues(row.issueDate, row.expirationDate, 'expirationDate'),
    ...urlIssues(row.credentialUrl, 'credentialUrl')
  ]
)

const projectSchema = withIssues(
  z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    url: z.string(),
    startDate: z.string(),
    endDate: z.string()
  }),
  (row) => [
    ...missingWhenFilled(row, [
      ['name', 'Add a project name'],
      ['description', 'Add a short description']
    ]),
    ...monthRangeIssues(row.startDate, row.endDate, 'endDate'),
    ...urlIssues(row.url, 'url')
  ]
)

const languageSchema = withIssues(
  z.object({ language: z.string(), proficiency: languageProficiencySchema.optional() }),
  (row) => missingWhenFilled(row, [['language', 'Add a language']])
)

const preferencesSchema = withIssues(
  z.object({
    desiredRoles: z.array(z.string()),
    preferredLocations: z.array(z.string()),
    preferredJobTypes: z.array(employmentTypeSchema),
    preferredIndustries: z.array(z.string()),
    workSetup: workSetupSchema.optional(),
    minimumSalary: z.string(),
    maximumSalary: z.string(),
    willingToRelocate: z.boolean(),
    willingToRemote: z.boolean()
  }),
  salaryIssues
)

export const profileSchema: z.ZodType<ProfileFormValues, ProfileFormValues> = z.object({
  headline: z.string(),
  about: z.string(),
  location: z.string(),
  careerLevel: z.union([z.literal(''), careerLevelSchema]),
  resumeFileName: z.string(),
  skills: z.array(skillSchema),
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
  certifications: z.array(certificationSchema),
  projects: z.array(projectSchema),
  languages: z.array(languageSchema),
  preferences: preferencesSchema
})
