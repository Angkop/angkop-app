import { EducationFields } from '@/components/profile-fields/education-fields'
import { StepSection } from './step-section'

export function EducationStep() {
  return (
    <StepSection
      title="Education"
      description="Fresh graduate with no work experience yet? That's completely fine. The Experience step is optional."
    >
      <EducationFields />
    </StepSection>
  )
}
