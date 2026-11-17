import {
  Award,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Languages as LanguagesIcon,
  ListChecks,
  Sparkles,
  Target,
  User
} from 'lucide-react'
import type { ProfileFormValues } from '@/lib/profile-form'

export const STEPS = [
  { id: 'about', label: 'About you', icon: User },
  { id: 'skills', label: 'Skills', icon: ListChecks },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'languages', label: 'Languages', icon: LanguagesIcon },
  { id: 'preferences', label: 'Preferences', icon: Target },
  { id: 'review', label: 'Review', icon: Sparkles }
] as const

// Which form fields each step edits, so Continue can validate just that step and a failed
// save can jump to the step that holds the error.
export const STEP_FIELDS: Record<(typeof STEPS)[number]['id'], (keyof ProfileFormValues)[]> = {
  about: ['headline', 'careerLevel', 'location', 'about'],
  skills: ['skills'],
  education: ['education'],
  experience: ['experience'],
  certifications: ['certifications'],
  projects: ['projects'],
  languages: ['languages'],
  preferences: ['preferences'],
  review: []
}
