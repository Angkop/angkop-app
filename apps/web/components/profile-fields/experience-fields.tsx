import { Plus, X } from 'lucide-react'
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { EMPLOYMENT_TYPE_LABELS } from '@angkop/shared'
import { FIELD_TYPE } from '@/components/common/form/constants/field-type'
import { Form } from '@/components/common/form/form'
import { FormField } from '@/components/form-field'
import { OptionSelect } from '@/components/option-select'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EMPTY_EXPERIENCE, type ProfileFormValues } from '@/lib/profile-form'

// One row per component so toggling "Current" only re-renders that row, not the whole list.
function ExperienceRow({ rowId, index, onRemove }: { rowId: string; index: number; onRemove: () => void }) {
  const {
    register,
    control,
    setValue,
    formState: { errors }
  } = useFormContext<ProfileFormValues>()
  const isCurrent = useWatch({ control, name: `experience.${index}.current` })
  const rowErrors = errors.experience?.[index]
  const fieldId = (name: string) => `experience-${rowId}-${name}`

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <FormField id={fieldId('title')} label="Job title" hideLabel error={rowErrors?.title?.message}>
          {(controlProps) => (
            <Input {...controlProps} {...register(`experience.${index}.title`)} placeholder="Job title" />
          )}
        </FormField>
        <FormField id={fieldId('company')} label="Company" hideLabel error={rowErrors?.company?.message}>
          {(controlProps) => (
            <Input {...controlProps} {...register(`experience.${index}.company`)} placeholder="Company" />
          )}
        </FormField>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <FormField id={fieldId('location')} label="Location" hideLabel error={rowErrors?.location?.message}>
          {(controlProps) => (
            <Input {...controlProps} {...register(`experience.${index}.location`)} placeholder="Location (optional)" />
          )}
        </FormField>
        <FormField
          id={fieldId('employment-type')}
          label="Employment type"
          hideLabel
          error={rowErrors?.employmentType?.message}
        >
          {(controlProps) => (
            <Controller
              control={control}
              name={`experience.${index}.employmentType`}
              render={({ field }) => (
                <OptionSelect
                  {...controlProps}
                  ref={field.ref}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  options={EMPLOYMENT_TYPE_LABELS}
                  placeholder="Employment type"
                  className="w-full"
                />
              )}
            />
          )}
        </FormField>
      </div>
      <div className="grid items-start gap-2 sm:grid-cols-3">
        <Form.Field<ProfileFormValues>
          fieldType={FIELD_TYPE.MONTH}
          name={`experience.${index}.startDate`}
          label="Start date"
          hideLabel
        />
        <Form.Field<ProfileFormValues>
          fieldType={FIELD_TYPE.MONTH}
          name={`experience.${index}.endDate`}
          label="End date"
          hideLabel
          disabled={isCurrent}
        />
        <div className="flex items-center justify-between gap-2 sm:h-9">
          <Form.Field<ProfileFormValues>
            fieldType={FIELD_TYPE.CHECKBOX}
            name={`experience.${index}.current`}
            label="Current"
            // A current role has no end date — clear it so a stale one doesn't linger.
            onValueChange={(checked) => {
              if (checked === true) setValue(`experience.${index}.endDate`, '')
            }}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove experience entry"
                onClick={onRemove}
              >
                <X className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove experience entry</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <FormField id={fieldId('description')} label="Description" hideLabel error={rowErrors?.description?.message}>
        {(controlProps) => (
          <Textarea
            {...controlProps}
            {...register(`experience.${index}.description`)}
            placeholder="What did you work on? (optional, but helps your matches)"
            rows={2}
          />
        )}
      </FormField>
    </div>
  )
}

export function ExperienceFields() {
  const { control } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'experience' })

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <ExperienceRow key={field.id} rowId={field.id} index={index} onRemove={() => remove(index)} />
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_EXPERIENCE)}>
        <Plus className="size-3.5" />
        Add experience
      </Button>
    </div>
  )
}
