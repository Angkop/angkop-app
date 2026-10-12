import { CAREER_LEVEL_LABELS, type CareerLevel } from '@angkop/shared'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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
  const sections = [
    {
      value: 'headline',
      label: 'Headline & career level',
      summary: [headline || 'Not set', careerLevel ? CAREER_LEVEL_LABELS[careerLevel] : null, location || null]
        .filter(Boolean)
        .join(' · ')
    },
    {
      value: 'skills',
      label: `Skills (${skills.length})`,
      summary: skills.length > 0 ? skills.map((skill) => skill.name).join(', ') : 'None added'
    },
    {
      value: 'education',
      label: `Education (${education.filter((e) => e.school).length})`,
      summary:
        education.filter((e) => e.school).length > 0
          ? education
              .filter((e) => e.school)
              .map((e) => e.school)
              .join(', ')
          : 'None added'
    },
    {
      value: 'experience',
      label: `Experience (${experience.length})`,
      summary: experience.length > 0 ? experience.map((e) => `${e.title} at ${e.company}`).join(', ') : 'None added'
    },
    {
      value: 'certifications',
      label: `Certifications (${certifications.length})`,
      summary: certifications.length > 0 ? certifications.map((c) => c.name).join(', ') : 'None added'
    },
    {
      value: 'projects',
      label: `Projects (${projects.length})`,
      summary: projects.length > 0 ? projects.map((p) => p.name).join(', ') : 'None added'
    },
    {
      value: 'preferences',
      label: `Desired roles (${preferences.desiredRoles.length})`,
      summary: preferences.desiredRoles.length > 0 ? preferences.desiredRoles.join(', ') : 'None added'
    },
    {
      value: 'resume',
      label: 'Resume',
      summary: resumeFileName || 'Not uploaded'
    }
  ]

  return (
    <StepSection
      title="Review"
      description="Here's what we'll use to start matching you. Everything here stays editable from Profile later."
    >
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
          <p className="mt-1 text-sm text-foreground">{email}</p>
        </div>
        <Badge variant="outline">Connected</Badge>
      </div>

      <Accordion type="multiple" defaultValue={sections.map((section) => section.value)} className="rounded-lg border border-border px-4">
        {sections.map((section) => (
          <AccordionItem key={section.value} value={section.value}>
            <AccordionTrigger className="font-medium text-foreground">{section.label}</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">{section.summary}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {saveError ? <ErrorMessage>Could not save your profile: {saveError.message}</ErrorMessage> : null}
    </StepSection>
  )
}
