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
