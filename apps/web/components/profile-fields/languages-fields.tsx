import { Plus, X } from 'lucide-react'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form'
import { LANGUAGE_PROFICIENCY_LABELS } from '@angkop/shared'
import { FormField } from '@/components/form-field'
import { OptionSelect } from '@/components/option-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EMPTY_LANGUAGE, type ProfileFormValues } from '@/lib/profile-form'

export function LanguagesFields() {
  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'languages' })

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const rowErrors = errors.languages?.[index]

        return (
          <div key={field.id} className="flex items-start gap-2 rounded-lg border border-border p-3">
            <FormField
              id={`language-${field.id}-name`}
              label="Language"
              hideLabel
              error={rowErrors?.language?.message}
              className="flex-1"
            >
              {(controlProps) => (
                <Input {...controlProps} {...register(`languages.${index}.language`)} placeholder="e.g. English" />
              )}
            </FormField>
            <FormField
              id={`language-${field.id}-proficiency`}
              label="Proficiency"
              hideLabel
              error={rowErrors?.proficiency?.message}
              className="w-40"
            >
              {(controlProps) => (
                <Controller
                  control={control}
                  name={`languages.${index}.proficiency`}
                  render={({ field: proficiencyField }) => (
                    <OptionSelect
                      {...controlProps}
                      ref={proficiencyField.ref}
                      value={proficiencyField.value}
                      onValueChange={proficiencyField.onChange}
                      onBlur={proficiencyField.onBlur}
                      options={LANGUAGE_PROFICIENCY_LABELS}
                      placeholder="Proficiency"
                      className="w-full"
                    />
                  )}
                />
              )}
            </FormField>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-1"
                  aria-label="Remove language"
                  onClick={() => remove(index)}
                >
                  <X className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove language</TooltipContent>
            </Tooltip>
          </div>
        )
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_LANGUAGE)}>
        <Plus className="size-3.5" />
        Add language
      </Button>
    </div>
  )
}
