import type { Dispatch, SetStateAction } from 'react'
import { PreferencesFields } from '@/components/profile-fields/preferences-fields'
import type { PreferencesEntry } from '@/lib/profile-form'
import { StepSection } from './step-section'

export function PreferencesStep({
  preferences,
  setPreferences
}: {
  preferences: PreferencesEntry
  setPreferences: Dispatch<SetStateAction<PreferencesEntry>>
}) {
  return (
    <StepSection
      title="What are you looking for?"
      description="This keeps your matches from scoring high on skills alone when the location or setup doesn't fit."
    >
      <PreferencesFields preferences={preferences} setPreferences={setPreferences} />
    </StepSection>
  )
}
