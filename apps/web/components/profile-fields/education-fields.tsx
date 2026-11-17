import { Plus, X } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EMPTY_EDUCATION, type ProfileFormValues } from '@/lib/profile-form'

export function EducationFields() {
  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'education' })

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const rowErrors = errors.education?.[index]
        const fieldId = (name: string) => `education-${field.id}-${name}`

        return (
          <div key={field.id} className="space-y-2 rounded-lg border border-border p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <FormField id={fieldId('school')} label="School" hideLabel error={rowErrors?.school?.message}>
                {(controlProps) => (
                  <Input {...controlProps} {...register(`education.${index}.school`)} placeholder="School" />
                )}
              </FormField>
              <FormField id={fieldId('degree')} label="Degree" hideLabel error={rowErrors?.degree?.message}>
                {(controlProps) => (
                  <Input
                    {...controlProps}
                    {...register(`education.${index}.degree`)}
                    placeholder="Degree (e.g. Bachelor of Science)"
                  />
                )}
              </FormField>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <FormField
                id={fieldId('field-of-study')}
                label="Field of study"
                hideLabel
                error={rowErrors?.fieldOfStudy?.message}
              >
                {(controlProps) => (
                  <Input
                    {...controlProps}
                    {...register(`education.${index}.fieldOfStudy`)}
                    placeholder="Field of study (e.g. Computer Science)"
                  />
                )}
              </FormField>
              <FormField id={fieldId('start-year')} label="Start year" hideLabel error={rowErrors?.startYear?.message}>
                {(controlProps) => (
                  <Input
                    {...controlProps}
                    {...register(`education.${index}.startYear`)}
                    type="number"
                    placeholder="Start year"
                  />
                )}
              </FormField>
              <div className="flex items-start gap-2">
                <FormField
                  id={fieldId('end-year')}
                  label="End year"
                  hideLabel
                  error={rowErrors?.endYear?.message}
                  className="flex-1"
                >
                  {(controlProps) => (
                    <Input
                      {...controlProps}
                      {...register(`education.${index}.endYear`)}
                      type="number"
                      placeholder="End year"
                    />
                  )}
                </FormField>
                {fields.length > 1 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="mt-1"
                        aria-label="Remove education entry"
                        onClick={() => remove(index)}
                      >
                        <X className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove education entry</TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </div>
            <FormField id={fieldId('description')} label="Description" hideLabel error={rowErrors?.description?.message}>
              {(controlProps) => (
                <Textarea
                  {...controlProps}
                  {...register(`education.${index}.description`)}
                  placeholder="Relevant coursework, honors, activities (optional)"
                  rows={2}
                />
              )}
            </FormField>
          </div>
        )
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_EDUCATION)}>
        <Plus className="size-3.5" />
        Add education
      </Button>
    </div>
  )
}
