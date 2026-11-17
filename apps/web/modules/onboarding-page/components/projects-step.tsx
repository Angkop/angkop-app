import { ProjectsFields } from '@/components/profile-fields/projects-fields'
import { StepSection } from './step-section'

export function ProjectsStep() {
  return (
    <StepSection
      title="Projects"
      description="Especially useful if you don't have much work experience yet. Show what you've actually built."
    >
      <ProjectsFields />
    </StepSection>
  )
}
