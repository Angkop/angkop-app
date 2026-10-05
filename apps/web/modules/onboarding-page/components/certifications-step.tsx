import { CertificationsFields } from '@/components/profile-fields/certifications-fields'
import type { ArrayHelpers, CertificationEntry } from '@/lib/profile-form'
import { StepSection } from './step-section'

export function CertificationsStep({
  certifications,
  certificationHelpers
}: {
  certifications: CertificationEntry[]
  certificationHelpers: ArrayHelpers<CertificationEntry>
}) {
  return (
    <StepSection
      title="Certifications"
      description="Online courses, bootcamps, and professional certifications all count."
    >
      <CertificationsFields certifications={certifications} certificationHelpers={certificationHelpers} />
    </StepSection>
  )
}
