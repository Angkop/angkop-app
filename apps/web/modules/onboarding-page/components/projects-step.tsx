import { ProjectsFields } from '@/components/profile-fields/projects-fields'
import type { ArrayHelpers, ProjectEntry } from '@/lib/profile-form'
import { StepSection } from './step-section'

export function ProjectsStep({
  projects,
  projectHelpers
}: {
  projects: ProjectEntry[]
  projectHelpers: ArrayHelpers<ProjectEntry>
}) {
  return (
    <StepSection
      title="Projects"
      description="Especially useful if you don't have much work experience yet — show what you've actually built."
    >
      <ProjectsFields projects={projects} projectHelpers={projectHelpers} />
    </StepSection>
  )
}
