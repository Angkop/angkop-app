import { Plus } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FIELD_TYPE } from '@/components/common/form/constants/field-type'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { EMPTY_PROJECT, type ProfileFormValues } from '@/lib/profile-form'
import { ChipListField } from './chip-list-field'
import { Entry, EntryList } from './entry'
import { ProfileField } from './profile-field'

export function ProjectsFields() {
  const { control } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'projects' })

  return (
    <div className="space-y-4">
      <EntryList>
        {fields.map((field, index) => (
          <Entry
            key={field.id}
            title={`Project ${index + 1}`}
            removeLabel="Remove project"
            onRemove={() => remove(index)}
          >
            <ProfileField
              fieldType={FIELD_TYPE.TEXT_INPUT}
              name={`projects.${index}.name`}
              label="Project name"
              placeholder="e.g. Job matching app"
            />
            <ProfileField
              fieldType={FIELD_TYPE.MULTILINE_TEXT_INPUT}
              name={`projects.${index}.description`}
              label="Description"
              rows={2}
              placeholder="What does it do, and what did you build?"
            />
            <div className="space-y-1.5">
              <Label className="text-xs font-normal text-muted-foreground">Technologies</Label>
              <ChipListField name={`projects.${index}.technologies`} placeholder="e.g. Next.js" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <ProfileField
                fieldType={FIELD_TYPE.TEXT_INPUT}
                name={`projects.${index}.url`}
                label="Link"
                placeholder="https://"
              />
              <ProfileField
                fieldType={FIELD_TYPE.MONTH}
                name={`projects.${index}.startDate`}
                label="Start date"
              />
              <ProfileField
                fieldType={FIELD_TYPE.MONTH}
                name={`projects.${index}.endDate`}
                label="End date"
              />
            </div>
          </Entry>
        ))}
      </EntryList>
      <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_PROJECT)}>
        <Plus className="size-3.5" />
        Add project
      </Button>
    </div>
  )
}
