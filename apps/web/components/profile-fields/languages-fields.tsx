import { Plus } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FIELD_TYPE } from '@/components/common/form/constants/field-type'
import { Button } from '@/components/ui/button'
import { LANGUAGE_PROFICIENCY_OPTIONS } from '@/constants/profile-form'
import { EMPTY_LANGUAGE, type ProfileFormValues } from '@/lib/profile-form'
import { Entry, EntryList } from './entry'
import { ProfileField } from './profile-field'

export function LanguagesFields() {
  const { control } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'languages' })

  return (
    <div className="space-y-4">
      <EntryList>
        {fields.map((field, index) => (
          <Entry
            key={field.id}
            title={`Language ${index + 1}`}
            removeLabel="Remove language"
            onRemove={() => remove(index)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField
                fieldType={FIELD_TYPE.TEXT_INPUT}
                name={`languages.${index}.language`}
                label="Language"
                placeholder="e.g. English"
              />
              <ProfileField
                fieldType={FIELD_TYPE.SELECT}
                name={`languages.${index}.proficiency`}
                label="Proficiency"
                options={LANGUAGE_PROFICIENCY_OPTIONS}
                placeholder="Select one"
              />
            </div>
          </Entry>
        ))}
      </EntryList>
      <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_LANGUAGE)}>
        <Plus className="size-3.5" />
        Add language
      </Button>
    </div>
  )
}
