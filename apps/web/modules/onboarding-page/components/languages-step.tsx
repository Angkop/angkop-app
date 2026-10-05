import { LanguagesFields } from '@/components/profile-fields/languages-fields'
import type { ArrayHelpers, LanguageEntry } from '@/lib/profile-form'
import { StepSection } from './step-section'

export function LanguagesStep({
  languages,
  languageHelpers
}: {
  languages: LanguageEntry[]
  languageHelpers: ArrayHelpers<LanguageEntry>
}) {
  return (
    <StepSection title="Languages" description="Some roles care which languages you speak and how well.">
      <LanguagesFields languages={languages} languageHelpers={languageHelpers} />
    </StepSection>
  )
}
