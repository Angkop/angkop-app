import { Plus } from 'lucide-react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { FIELD_TYPE } from '@/components/common/form/constants/field-type'
import { Button } from '@/components/ui/button'
import { EMPLOYMENT_TYPE_OPTIONS } from '@/constants/profile-form'
import { EMPTY_EXPERIENCE, type ProfileFormValues } from '@/lib/profile-form'
import { Entry, EntryList } from './entry'
import { ProfileField } from './profile-field'

// One row per component so toggling "Current" only re-renders that row, not the whole list.
function ExperienceRow({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { control, setValue } = useFormContext<ProfileFormValues>()
  const isCurrent = useWatch({ control, name: `experience.${index}.current` })

  return (
    <Entry title={`Experience ${index + 1}`} removeLabel="Remove experience entry" onRemove={onRemove}>
      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileField
          fieldType={FIELD_TYPE.TEXT_INPUT}
          name={`experience.${index}.title`}
          label="Job title"
          placeholder="e.g. Software Engineer"
        />
        <ProfileField
          fieldType={FIELD_TYPE.TEXT_INPUT}
          name={`experience.${index}.company`}
          label="Company"
          placeholder="e.g. Acme Corp"
        />
        <ProfileField
          fieldType={FIELD_TYPE.TEXT_INPUT}
          name={`experience.${index}.location`}
          label="Location"
          placeholder="e.g. Makati City"
        />
        <ProfileField
          fieldType={FIELD_TYPE.SELECT}
          name={`experience.${index}.employmentType`}
          label="Employment type"
          options={EMPLOYMENT_TYPE_OPTIONS}
          placeholder="Select one"
        />
      </div>
      <div className="space-y-2.5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField
            fieldType={FIELD_TYPE.MONTH}
            name={`experience.${index}.startDate`}
            label="Start date"
          />
          <ProfileField
            fieldType={FIELD_TYPE.MONTH}
            name={`experience.${index}.endDate`}
            label="End date"
            disabled={isCurrent}
          />
        </div>
        <ProfileField
          fieldType={FIELD_TYPE.CHECKBOX}
          name={`experience.${index}.current`}
          label="I currently work here"
          // A current role has no end date — clear it so a stale one doesn't linger.
          onValueChange={(checked) => {
            if (checked === true) setValue(`experience.${index}.endDate`, '')
          }}
        />
      </div>
      <ProfileField
        fieldType={FIELD_TYPE.MULTILINE_TEXT_INPUT}
        name={`experience.${index}.description`}
        label="Description"
        rows={2}
        placeholder="What did you work on? It helps your matches."
      />
    </Entry>
  )
}

export function ExperienceFields() {
  const { control } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'experience' })

  return (
    <div className="space-y-4">
      <EntryList>
        {fields.map((field, index) => (
          <ExperienceRow key={field.id} index={index} onRemove={() => remove(index)} />
        ))}
      </EntryList>
      <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_EXPERIENCE)}>
        <Plus className="size-3.5" />
        Add experience
      </Button>
    </div>
  )
}
