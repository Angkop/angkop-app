import { Controller, useFormContext } from 'react-hook-form'
import { CAREER_LEVEL_LABELS } from '@angkop/shared'
import { FormField } from '@/components/form-field'
import { OptionSelect } from '@/components/option-select'
import { Input, Textarea } from '@/components/ui/input'
import type { ProfileFormValues } from '@/lib/profile-form'

export function AboutFields() {
  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<ProfileFormValues>()

  return (
    <>
      <FormField id="headline" orientation="horizontal" label="Headline" error={errors.headline?.message}>
        {(controlProps) => (
          <Input {...controlProps} {...register('headline')} placeholder="e.g. Front-End Developer" />
        )}
      </FormField>

      <FormField
        id="career-level"
        orientation="horizontal"
        label="Where are you in your career?"
        error={errors.careerLevel?.message}
      >
        {(controlProps) => (
          <Controller
            control={control}
            name="careerLevel"
            render={({ field }) => (
              <OptionSelect
                {...controlProps}
                ref={field.ref}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                options={CAREER_LEVEL_LABELS}
                placeholder="Select one"
                className="w-full"
              />
            )}
          />
        )}
      </FormField>

      <FormField id="location" orientation="horizontal" label="Where are you based?" error={errors.location?.message}>
        {(controlProps) => (
          <Input {...controlProps} {...register('location')} placeholder="e.g. Muntinlupa City, Metro Manila" />
        )}
      </FormField>

      <FormField id="about" orientation="horizontal" label="About" error={errors.about?.message}>
        {(controlProps) => (
          <Textarea
            {...controlProps}
            {...register('about')}
            rows={4}
            placeholder="A short introduction: what you do and what you're looking for."
          />
        )}
      </FormField>
    </>
  )
}
