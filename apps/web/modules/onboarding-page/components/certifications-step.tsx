import { CertificationsFields } from '@/components/profile-fields/certifications-fields'
import { StepSection } from './step-section'

export function CertificationsStep() {
  return (
    <StepSection
      title="Certifications"
      description="Online courses, bootcamps, and professional certifications all count."
    >
      <CertificationsFields />
    </StepSection>
  )
}
