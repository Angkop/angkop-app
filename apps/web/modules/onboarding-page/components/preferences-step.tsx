import { PreferencesFields } from '@/components/profile-fields/preferences-fields'
import { StepSection } from './step-section'

export function PreferencesStep() {
  return (
    <StepSection
      title="What are you looking for?"
      description="This keeps your matches from scoring high on skills alone when the location or setup doesn't fit."
    >
      <PreferencesFields />
    </StepSection>
  )
}
