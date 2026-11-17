import { Plus, X } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EMPTY_PROJECT, type ProfileFormValues } from '@/lib/profile-form'
import { ChipListField } from './chip-list-field'

export function ProjectsFields() {
  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'projects' })

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const rowErrors = errors.projects?.[index]
        const fieldId = (name: string) => `project-${field.id}-${name}`

        return (
          <div key={field.id} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-start gap-2">
              <FormField
                id={fieldId('name')}
                label="Project name"
                hideLabel
                error={rowErrors?.name?.message}
                className="flex-1"
              >
                {(controlProps) => (
                  <Input {...controlProps} {...register(`projects.${index}.name`)} placeholder="Project name" />
                )}
              </FormField>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mt-1"
                    aria-label="Remove project"
                    onClick={() => remove(index)}
                  >
                    <X className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove project</TooltipContent>
              </Tooltip>
            </div>
            <FormField id={fieldId('description')} label="Description" hideLabel error={rowErrors?.description?.message}>
              {(controlProps) => (
                <Textarea
                  {...controlProps}
                  {...register(`projects.${index}.description`)}
                  placeholder="What does it do, and what did you build?"
                  rows={2}
                />
              )}
            </FormField>
            <ChipListField name={`projects.${index}.technologies`} placeholder="e.g. Next.js" />
            <div className="grid items-start gap-2 sm:grid-cols-3">
              <FormField id={fieldId('url')} label="Link" hideLabel error={rowErrors?.url?.message}>
                {(controlProps) => (
                  <Input {...controlProps} {...register(`projects.${index}.url`)} placeholder="Link (optional)" />
                )}
              </FormField>
              <FormField id={fieldId('start-date')} label="Start date" hideLabel error={rowErrors?.startDate?.message}>
                {(controlProps) => (
                  <Input {...controlProps} {...register(`projects.${index}.startDate`)} type="month" />
                )}
              </FormField>
              <FormField id={fieldId('end-date')} label="End date" hideLabel error={rowErrors?.endDate?.message}>
                {(controlProps) => (
                  <Input
                    {...controlProps}
                    {...register(`projects.${index}.endDate`)}
                    type="month"
                    placeholder="End date (optional)"
                  />
                )}
              </FormField>
            </div>
          </div>
        )
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_PROJECT)}>
        <Plus className="size-3.5" />
        Add project
      </Button>
    </div>
  )
}
