import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import { SKILL_LEVEL_LABELS } from '@angkop/shared'
import { FormField } from '@/components/form-field'
import { OptionSelect } from '@/components/option-select'
import { ChipList } from '@/components/chip-list'
import { Input } from '@/components/ui/input'
import type { ProfileFormValues } from '@/lib/profile-form'

export function SkillsFields() {
  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'skills' })

  return (
    <>
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

      {fields.length > 0 ? (
        <div className="space-y-2">
          {fields.map((field, index) => {
            const rowErrors = errors.skills?.[index]

            return (
              <div
                key={field.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-start"
              >
                <span className="flex-1 truncate text-sm font-medium text-foreground sm:pt-2">{field.name}</span>
                <FormField
                  id={`skill-${field.id}-level`}
                  label={`${field.name} level`}
                  hideLabel
                  error={rowErrors?.level?.message}
                  className="sm:w-36"
                >
                  {(controlProps) => (
                    <Controller
                      control={control}
                      name={`skills.${index}.level`}
                      render={({ field: levelField }) => (
                        <OptionSelect
                          {...controlProps}
                          ref={levelField.ref}
                          value={levelField.value}
                          onValueChange={levelField.onChange}
                          onBlur={levelField.onBlur}
                          options={SKILL_LEVEL_LABELS}
                          placeholder="Level"
                          className="w-full"
                        />
                      )}
                    />
                  )}
                </FormField>
                <FormField
                  id={`skill-${field.id}-years`}
                  label={`${field.name} years of experience`}
                  hideLabel
                  error={rowErrors?.years?.message}
                  className="sm:w-20"
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
                      placeholder="Years"
                    />
                  )}
                </FormField>
              </div>
            )
          })}
        </div>
      ) : null}
    </>
  )
}
