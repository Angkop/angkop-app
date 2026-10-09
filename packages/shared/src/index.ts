export type Platform = 'demo' | 'jobstreet' | 'indeed' | 'linkedin' | 'kalibrr' | 'philjobnet' | 'glassdoor'

export type InteractionEventType = 'view' | 'save' | 'apply' | 'dismiss'

export const INTERACTION_WEIGHTS: Record<InteractionEventType, number> = {
  apply: 5,
  save: 3,
  view: 1,
  dismiss: -2
}

export type MatchLabel = 'Strong Match' | 'Partial Match' | 'Weak Match'

export const MATCH_SCORE_THRESHOLDS = {
  STRONG: 0.7,
  PARTIAL: 0.4,
  // Below this, a job never appears in the matches browse list at all — too weak a
  // signal to be worth showing, as opposed to PARTIAL/STRONG which only affect the label.
  MINIMUM: 0.4
} as const

export function getMatchLabel(score: number): MatchLabel {
  if (score >= MATCH_SCORE_THRESHOLDS.STRONG) return 'Strong Match'
  if (score >= MATCH_SCORE_THRESHOLDS.PARTIAL) return 'Partial Match'
  return 'Weak Match'
}

export type CareerLevel = 'STUDENT' | 'ENTRY_LEVEL' | 'JUNIOR' | 'MID_LEVEL' | 'SENIOR' | 'LEAD' | 'MANAGER'

export const CAREER_LEVEL_LABELS: Record<CareerLevel, string> = {
  STUDENT: 'Student',
  ENTRY_LEVEL: 'Entry level',
  JUNIOR: 'Junior',
  MID_LEVEL: 'Mid level',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  MANAGER: 'Manager'
}

export type WorkSetup = 'REMOTE' | 'HYBRID' | 'ONSITE'

export const WORK_SETUP_LABELS: Record<WorkSetup, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'Onsite'
}

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE'

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance'
}

export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced'
}

export type LanguageProficiency = 'BASIC' | 'CONVERSATIONAL' | 'PROFESSIONAL' | 'NATIVE'

export const LANGUAGE_PROFICIENCY_LABELS: Record<LanguageProficiency, string> = {
  BASIC: 'Basic',
  CONVERSATIONAL: 'Conversational',
  PROFESSIONAL: 'Professional',
  NATIVE: 'Native'
}

export type ProfileSkill = {
  name: string
  category: string | null
  level: SkillLevel | null
  years: number | null
}

export type Education = {
  school: string
  degree: string | null
  fieldOfStudy: string | null
  startYear: number | null
  endYear: number | null
  description: string | null
}

export type WorkExperience = {
  title: string
  company: string
  location: string | null
  employmentType: EmploymentType | null
  description: string | null
  startDate: string
  endDate: string | null
  current: boolean
}

export type Certification = {
  name: string
  issuer: string
  issueDate: string | null
  expirationDate: string | null
  credentialId: string | null
  credentialUrl: string | null
}

export type Project = {
  name: string
  description: string
  technologies: string[]
  url: string | null
  startDate: string | null
  endDate: string | null
}

export type Language = {
  language: string
  proficiency: LanguageProficiency | null
}

export type UserPreference = {
  desiredRoles: string[]
  preferredLocations: string[]
  preferredJobTypes: EmploymentType[]
  preferredIndustries: string[]
  workSetup: WorkSetup | null
  minimumSalary: number | null
  maximumSalary: number | null
  willingToRelocate: boolean
  willingToRemote: boolean
}

export type UserProfile = {
  id: string
  userId: string
  headline: string | null
  about: string | null
  skills: ProfileSkill[]
  skillsText: string
  careerLevel: CareerLevel | null
  location: string | null
  resumeFileName: string | null
  education: Education[]
  experience: WorkExperience[]
  certifications: Certification[]
  projects: Project[]
  languages: Language[]
  preferences: UserPreference | null
}

export type Job = {
  id: string
  platformJobId: string
  platform: Platform
  title: string
  company: string
  description: string
  requiredSkills: string[]
  url: string
  sourceName?: string | null
  sourceUrl?: string | null
}

export type JobMatch = {
  job: Job
  semanticScore: number
  collaborativeScore: number
  hybridScore: number
}

export type SkillGap = {
  skill: string
  confidence: number
  courses: Course[]
}

export type Course = {
  title: string
  provider: string
  url: string
  thumbnail?: string | null
  description?: string | null
}

export type ApplicationStatus =
  | 'PENDING'
  | 'APPLIED'
  | 'AWAITING_INTERVIEW'
  | 'ONGOING_INTERVIEW'
  | 'INTERVIEWED'
  | 'SUCCESSFUL'
  | 'UNSUCCESSFUL'

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  APPLIED: 'Applied',
  AWAITING_INTERVIEW: 'Awaiting interview',
  ONGOING_INTERVIEW: 'Ongoing interview',
  INTERVIEWED: 'Interviewed',
  SUCCESSFUL: 'Successful',
  UNSUCCESSFUL: 'Unsuccessful'
}

export type SavedJob = {
  id: number
  job: Job
  status: ApplicationStatus
  tags: string[]
  interviewDate: string | null
  createdAt: string
  hybridScore: number
}

export type SavedCourse = {
  id: number
  title: string
  provider: string
  url: string
}

export type EmbedRequest = {
  text: string
}

export type EmbedResponse = {
  embedding: number[]
}

export type RecommendRequest = {
  userId: string
  jobId: string
  userSkillsText: string
  jobText: string
  userInteractionCount: number
}

export type RecommendResponse = {
  semanticScore: number
  collaborativeScore: number
  hybridScore: number
  collaborativeWeight: number
}

export type SkillGapRequest = {
  userSkills: string[]
  jobRequiredSkills: string[]
}

export type SkillGapResponse = {
  missingSkills: SkillGap[]
}

export type MatchInsightRequest = {
  jobTitle: string
  jobCompany: string
  jobDescription: string
  jobRequiredSkills: string[]
  userSkillsText: string
  semanticScore: number
  collaborativeScore: number
  hybridScore: number
}

export type MatchInsightResponse = {
  explanation: string
  // Plain-language, job-specific justifications for semanticScore/collaborativeScore —
  // written for a job seeker, not in the algorithm's own vocabulary.
  skillsReason: string
  activityReason: string
  matchingSkills: string[]
  missingSkills: string[]
}

// Served to the web client — the algorithm's score breakdown plus the Gemini-generated
// explanation, combined into one shape so the "why this match" dialog renders both from a
// single query. requiredSkillsCount/interactionCount/collaborativeWeight are the concrete
// numbers behind each percentage, shown alongside the plain-language reasons.
export type MatchInsight = MatchInsightResponse & {
  semanticScore: number
  collaborativeScore: number
  hybridScore: number
  requiredSkillsCount: number
  interactionCount: number
  collaborativeWeight: number
}

export type ResumeParseRequest = {
  resumeText: string
  email?: string | null
  phone?: string | null
  links?: { label: string; url: string }[]
}

// The subset of UserProfile a resume parse can plausibly populate — no id/userId/
// skillsText/resumeFileName/preferences. The ML service clamps every enum-shaped field
// to these exact unions server-side before a value ever reaches here (see
// ml/app/services/resume_parser.py), so the web client can treat them as trusted.
export type ParsedResumeProfile = {
  headline: string | null
  about: string | null
  careerLevel: CareerLevel | null
  location: string | null
  // Regex-extracted locally in Express and merged over whatever Gemini found — not
  // currently wired into any profile field (UserProfile has no phone/links columns),
  // returned for display and future use (e.g. the cover-letter generator).
  email: string | null
  phone: string | null
  links: { label: string; url: string }[]
  skills: {
    name: string
    category: string | null
    level: SkillLevel | null
    years: number | null
  }[]
  education: {
    school: string
    degree: string | null
    fieldOfStudy: string | null
    startYear: number | null
    endYear: number | null
    description: string | null
  }[]
  experience: {
    title: string
    company: string
    location: string | null
    employmentType: EmploymentType | null
    description: string | null
    startDate: string | null
    endDate: string | null
    current: boolean
  }[]
  certifications: {
    name: string
    issuer: string
    issueDate: string | null
    expirationDate: string | null
    credentialId: string | null
    credentialUrl: string | null
  }[]
  projects: {
    name: string
    description: string
    technologies: string[]
    url: string | null
    startDate: string | null
    endDate: string | null
  }[]
  languages: {
    language: string
    proficiency: LanguageProficiency | null
  }[]
}

// A job description's prose, split at its own headings (real <h2>-style tags, or a
// paragraph that's entirely one bolded phrase — both patterns appear across RemoteOK and
// Arbeitnow). heading is null for the lead-in text before any heading is found — rendered
// as plain paragraphs, not collapsed, since it's the overview a reader should see first.
export type DescriptionSection = {
  heading: string | null
  items: string[]
}
