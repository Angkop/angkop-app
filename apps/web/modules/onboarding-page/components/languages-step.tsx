import { Plus, X } from 'lucide-react'
import { LANGUAGE_PROFICIENCY_LABELS, type LanguageProficiency } from '@angkop/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { LanguageEntry } from '@/lib/onboarding-profile'
import type { ArrayHelpers } from '../utils'
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
      <div className="space-y-3">
        {languages.map((item, index) => (
          <div key={index} className="flex items-center gap-2 rounded-lg border border-border p-3">
            <Input
              value={item.language}
              onChange={(event) => languageHelpers.update(index, 'language', event.target.value)}
              placeholder="e.g. English"
              className="flex-1"
            />
            <Select
              value={item.proficiency ?? ''}
              onValueChange={(value) => languageHelpers.update(index, 'proficiency', value as LanguageProficiency)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Proficiency" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(LANGUAGE_PROFICIENCY_LABELS) as [LanguageProficiency, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove language"
              onClick={() => languageHelpers.remove(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={languageHelpers.add}>
          <Plus className="size-3.5" />
          Add language
        </Button>
      </div>
    </StepSection>
  )
}
