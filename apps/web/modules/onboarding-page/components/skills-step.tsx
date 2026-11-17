import { SkillsFields } from '@/components/profile-fields/skills-fields'
import { StepSection } from './step-section'

export function SkillsStep() {
  return (
    <StepSection
      title="Skills"
      description="Add the skills, tools, and technologies you'd put on a resume. The more specific, the better your matches."
    >
      <SkillsFields />
    </StepSection>
  )
}
