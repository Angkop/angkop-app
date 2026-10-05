import { ExperienceFields } from '@/components/profile-fields/experience-fields'
import type { ArrayHelpers, ExperienceEntry } from '@/lib/profile-form'
import { StepSection } from './step-section'

export function ExperienceStep({
  experience,
  experienceHelpers
}: {
  experience: ExperienceEntry[]
  experienceHelpers: ArrayHelpers<ExperienceEntry>
}) {
  return (
    <StepSection
      title="Work experience"
      description="Internships count. Leave this empty if you don't have any yet — we'll match mostly on your skills and projects."
    >
      <ExperienceFields experience={experience} experienceHelpers={experienceHelpers} />
    </StepSection>
  )
}
