import { EducationFields } from '@/components/profile-fields/education-fields'
import type { ArrayHelpers, EducationEntry } from '@/lib/profile-form'
import { StepSection } from './step-section'

export function EducationStep({
  education,
  educationHelpers
}: {
  education: EducationEntry[]
  educationHelpers: ArrayHelpers<EducationEntry>
}) {
  return (
    <StepSection
      title="Education"
      description="Fresh graduate with no work experience yet? That's completely fine — the Experience step is optional."
    >
      <EducationFields education={education} educationHelpers={educationHelpers} />
    </StepSection>
  )
}
