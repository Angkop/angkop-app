import { Plus } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FIELD_TYPE } from '@/components/common/form/constants/field-type'
import { Button } from '@/components/ui/button'
import { EMPTY_EDUCATION, type ProfileFormValues } from '@/lib/profile-form'
import { Entry, EntryList } from './entry'
import { ProfileField } from './profile-field'

export function EducationFields() {
  const { control } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'education' })

  return (
    <div className="space-y-4">
      <EntryList>
        {fields.map((field, index) => (
          <Entry
            key={field.id}
            title={`Education ${index + 1}`}
            removeLabel="Remove education entry"
            onRemove={() => remove(index)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField
                fieldType={FIELD_TYPE.TEXT_INPUT}
                name={`education.${index}.school`}
                label="School"
                placeholder="e.g. Lyceum of Alabang"
              />
              <ProfileField
                fieldType={FIELD_TYPE.TEXT_INPUT}
                name={`education.${index}.degree`}
                label="Degree"
                placeholder="e.g. Bachelor of Science"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <ProfileField
                fieldType={FIELD_TYPE.TEXT_INPUT}
                name={`education.${index}.fieldOfStudy`}
                label="Field of study"
                placeholder="e.g. Computer Science"
              />
              <ProfileField
                fieldType={FIELD_TYPE.TEXT_INPUT}
                name={`education.${index}.startYear`}
                label="Start year"
                inputType="number"
                placeholder="2022"
              />
              <ProfileField
                fieldType={FIELD_TYPE.TEXT_INPUT}
                name={`education.${index}.endYear`}
                label="End year"
                inputType="number"
                placeholder="2026"
              />
            </div>
            <ProfileField
              fieldType={FIELD_TYPE.MULTILINE_TEXT_INPUT}
              name={`education.${index}.description`}
              label="Description"
              rows={2}
              placeholder="Relevant coursework, honors, activities"
            />
          </Entry>
        ))}
      </EntryList>
      <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_EDUCATION)}>
        <Plus className="size-3.5" />
        Add education
      </Button>
    </div>
  )
}
