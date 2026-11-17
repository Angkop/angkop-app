import { ListChecks, Plus } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FIELD_TYPE } from '@/components/common/form/constants/field-type'
import { EmptyState } from '@/components/common/empty-state'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SKILL_LEVEL_OPTIONS } from '@/constants/profile-form'
import { EMPTY_SKILL, type ProfileFormValues } from '@/lib/profile-form'
import { RemoveEntryButton } from './entry'
import { ProfileField } from './profile-field'

// Skill, level, years and the remove button on one line from `sm` up; stacked on phones.
const SKILL_ROW_COLUMNS = 'gap-x-3 gap-y-2 sm:grid sm:grid-cols-[minmax(0,1fr)_10rem_6rem_1.75rem]'

export function SkillsFields() {
  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'skills' })

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No skills yet"
          description="Add the skills you would put on a resume, or upload your resume and we will fill them in."
        />
      ) : (
        <div>
          <div aria-hidden="true" className={`${SKILL_ROW_COLUMNS} hidden pb-2 text-xs text-muted-foreground sm:grid`}>
            <span>Skill</span>
            <span>Level</span>
            <span>Years</span>
          </div>
          <div className="divide-y divide-border border-t border-border">
            {fields.map((field, index) => (
              <div key={field.id} className={`${SKILL_ROW_COLUMNS} grid grid-cols-[minmax(0,1fr)_auto] items-start py-3`}>
                <ProfileField
                  fieldType={FIELD_TYPE.TEXT_INPUT}
                  name={`skills.${index}.name`}
                  label="Skill"
                  labelClassName="sm:sr-only"
                  placeholder="e.g. React"
                />
                <div className="col-span-2 grid grid-cols-2 gap-3 sm:contents">
                  <ProfileField
                    fieldType={FIELD_TYPE.SELECT}
                    name={`skills.${index}.level`}
                    label="Level"
                    labelClassName="sm:sr-only"
                    options={SKILL_LEVEL_OPTIONS}
                    placeholder="Select"
                  />
                  <FormField
                    id={`skill-${field.id}-years`}
                    label="Years"
                    size="sm"
                    labelClassName="sm:sr-only"
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
                <div className="col-start-2 row-start-1 sm:col-start-4 sm:pt-1">
                  <RemoveEntryButton label="Remove skill" onRemove={() => remove(index)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_SKILL)}>
        <Plus className="size-3.5" />
        Add skill
      </Button>
    </div>
  )
}
