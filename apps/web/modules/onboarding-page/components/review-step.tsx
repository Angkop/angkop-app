import { Sparkles } from 'lucide-react'
import { CAREER_LEVEL_LABELS, type CareerLevel } from '@angkop/shared'
import { Badge } from '@/components/ui/badge'
import { ErrorMessage } from '@/components/error-message'
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  PreferencesEntry,
  ProfileSkillEntry,
  ProjectEntry
} from '@/lib/profile-form'
import { StepSection } from './step-section'

export function ReviewStep({
  email,
  headline,
  careerLevel,
  location,
  skills,
  education,
  experience,
  certifications,
  projects,
  preferences,
  resumeFileName,
  saveError
}: {
  email: string
  headline: string
  careerLevel: CareerLevel | ''
  location: string
  skills: ProfileSkillEntry[]
  education: EducationEntry[]
  experience: ExperienceEntry[]
  certifications: CertificationEntry[]
  projects: ProjectEntry[]
  preferences: PreferencesEntry
  resumeFileName: string
  saveError?: { message: string }
}) {
  return (
    <StepSection
      title="Review"
      description="Here's what we'll use to start matching you. Everything here stays editable from Profile later."
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
            <p className="mt-1 text-sm text-foreground">{email}</p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            Connected
          </Badge>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Headline &amp; career level</p>
          <p className="mt-1 text-sm text-foreground">
            {headline || 'Not set'}
            {careerLevel ? ` · ${CAREER_LEVEL_LABELS[careerLevel]}` : ''}
            {location ? ` · ${location}` : ''}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Skills ({skills.length})</p>
          <p className="mt-1 text-sm text-foreground">
            {skills.length > 0 ? skills.map((skill) => skill.name).join(', ') : 'None added'}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Education ({education.filter((e) => e.school).length})
          </p>
          <p className="mt-1 text-sm text-foreground">
            {education.filter((e) => e.school).length > 0
              ? education
                  .filter((e) => e.school)
                  .map((e) => e.school)
                  .join(', ')
              : 'None added'}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Experience ({experience.length})</p>
          <p className="mt-1 text-sm text-foreground">
            {experience.length > 0 ? experience.map((e) => `${e.title} at ${e.company}`).join(', ') : 'None added'}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Certifications ({certifications.length})</p>
          <p className="mt-1 text-sm text-foreground">
            {certifications.length > 0 ? certifications.map((c) => c.name).join(', ') : 'None added'}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Projects ({projects.length})</p>
          <p className="mt-1 text-sm text-foreground">
            {projects.length > 0 ? projects.map((p) => p.name).join(', ') : 'None added'}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">
            Desired roles ({preferences.desiredRoles.length})
          </p>
          <p className="mt-1 text-sm text-foreground">
            {preferences.desiredRoles.length > 0 ? preferences.desiredRoles.join(', ') : 'None added'}
          </p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">Resume</p>
          <p className="mt-1 text-sm text-foreground">{resumeFileName || 'Not uploaded'}</p>
        </div>
      </div>
      {saveError ? <ErrorMessage>Could not save your profile: {saveError.message}</ErrorMessage> : null}
    </StepSection>
  )
}
