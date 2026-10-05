import {
  Award,
  Briefcase,
  FileText,
  FolderGit2,
  GraduationCap,
  Languages as LanguagesIcon,
  ListChecks,
  Sparkles,
  Target,
  User
} from 'lucide-react'
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  PreferencesEntry,
  ProjectEntry
} from '@/lib/onboarding-profile'

export const STEPS = [
  { id: 'about', label: 'About you', icon: User },
  { id: 'skills', label: 'Skills', icon: ListChecks },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'languages', label: 'Languages', icon: LanguagesIcon },
  { id: 'preferences', label: 'Preferences', icon: Target },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'review', label: 'Review', icon: Sparkles }
] as const

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
