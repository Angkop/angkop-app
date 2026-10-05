import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CertificationEntry } from '@/lib/onboarding-profile'
import type { ArrayHelpers } from '../utils'
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
      <div className="space-y-3">
        {certifications.map((item, index) => (
          <div key={index} className="space-y-2 rounded-lg border border-border p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={item.name}
                onChange={(event) => certificationHelpers.update(index, 'name', event.target.value)}
                placeholder="Certification name"
              />
              <Input
                value={item.issuer}
                onChange={(event) => certificationHelpers.update(index, 'issuer', event.target.value)}
                placeholder="Issuer (e.g. Amazon Web Services)"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                type="month"
                value={item.issueDate}
                onChange={(event) => certificationHelpers.update(index, 'issueDate', event.target.value)}
                placeholder="Issue date"
              />
              <Input
                type="month"
                value={item.expirationDate}
                onChange={(event) => certificationHelpers.update(index, 'expirationDate', event.target.value)}
                placeholder="Expiration (optional)"
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove certification"
                  onClick={() => certificationHelpers.remove(index)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={item.credentialId}
                onChange={(event) => certificationHelpers.update(index, 'credentialId', event.target.value)}
                placeholder="Credential ID (optional)"
              />
              <Input
                value={item.credentialUrl}
                onChange={(event) => certificationHelpers.update(index, 'credentialUrl', event.target.value)}
                placeholder="Credential URL (optional)"
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={certificationHelpers.add}>
          <Plus className="size-3.5" />
          Add certification
        </Button>
      </div>
    </StepSection>
  )
}
