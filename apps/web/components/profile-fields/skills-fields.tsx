import { useFieldArray, useFormContext } from 'react-hook-form'
import { FIELD_TYPE } from '@/components/common/form/constants/field-type'
import { FormField } from '@/components/form-field'
import { ChipList } from '@/components/chip-list'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SKILL_LEVEL_OPTIONS } from '@/constants/profile-form'
import type { ProfileFormValues } from '@/lib/profile-form'
import { Entry, EntryList } from './entry'
import { ProfileField } from './profile-field'

export function SkillsFields() {
  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'skills' })

  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-muted-foreground">Skills</Label>
        <div className="rounded-lg border border-border p-4">
          <ChipList
            items={fields.map((field) => field.name)}
            onAdd={(value) => append({ name: value })}
            onRemove={(value) => remove(fields.findIndex((field) => field.name === value))}
            placeholder="e.g. React"
          />
          {fields.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              No skills yet. Matches will lean on your resume once you upload it.
            </p>
          ) : null}
        </div>
      </div>

      {fields.length > 0 ? (
        <EntryList>
          {fields.map((field, index) => (
            <Entry key={field.id} title={field.name}>
              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileField
                  fieldType={FIELD_TYPE.SELECT}
                  name={`skills.${index}.level`}
                  label="Level"
                  options={SKILL_LEVEL_OPTIONS}
                  placeholder="Select one"
                />
                <FormField
                  id={`skill-${field.id}-years`}
                  label="Years of experience"
                  size="sm"
                  error={errors.skills?.[index]?.years?.message}
                >
                  {(controlProps) => (
                    <Input
                      {...controlProps}
                      {...register(`skills.${index}.years`, {
                        setValueAs: (value: string) => (value === '' ? undefined : Number(value))
                      })}
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g. 2"
                      className="h-9 px-3 py-2"
                    />
                  )}
                </FormField>
              </div>
            </Entry>
          ))}
        </EntryList>
      ) : null}
    </>
  )
}
