import { LanguagesFields } from '@/components/profile-fields/languages-fields'
import { StepSection } from './step-section'

export function LanguagesStep() {
  return (
    <StepSection title="Languages" description="Some roles care which languages you speak and how well.">
      <LanguagesFields />
    </StepSection>
  )
}
