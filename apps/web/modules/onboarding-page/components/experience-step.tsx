import { ExperienceFields } from '@/components/profile-fields/experience-fields'
import { StepSection } from './step-section'

export function ExperienceStep() {
  return (
    <StepSection
      title="Work experience"
      description="Internships count. Leave this empty if you don't have any yet, and we'll match mostly on your skills and projects."
    >
      <ExperienceFields />
    </StepSection>
  )
}
