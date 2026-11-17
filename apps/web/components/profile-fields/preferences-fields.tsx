import { Controller, useFormContext } from 'react-hook-form'
import { EMPLOYMENT_TYPE_LABELS, WORK_SETUP_LABELS, type EmploymentType } from '@angkop/shared'
import { FormField } from '@/components/form-field'
import { OptionSelect } from '@/components/option-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { YES_NO_LABELS } from '@/constants/profile-form'
import type { ProfileFormValues } from '@/lib/profile-form'
import { ChipListField } from './chip-list-field'
import { ToggleChip } from './toggle-chip'

export function PreferencesFields() {
  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<ProfileFormValues>()
  const preferenceErrors = errors.preferences

  return (
    <>
      <div className="space-y-1.5">
        <Label>Desired roles</Label>
        <div className="rounded-lg border border-border p-4">
          <ChipListField name="preferences.desiredRoles" placeholder="e.g. Frontend Developer" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Preferred locations</Label>
        <div className="rounded-lg border border-border p-4">
          <ChipListField name="preferences.preferredLocations" placeholder="e.g. Metro Manila" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Job types</Label>
        <Controller
          control={control}
          name="preferences.preferredJobTypes"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(([value, label]) => (
                <ToggleChip
                  key={value}
                  label={label}
                  selected={field.value.includes(value)}
                  onToggle={() =>
                    field.onChange(
                      field.value.includes(value)
                        ? field.value.filter((type) => type !== value)
                        : [...field.value, value]
                    )
                  }
                />
              ))}
            </div>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Preferred industries</Label>
        <div className="rounded-lg border border-border p-4">
          <ChipListField name="preferences.preferredIndustries" placeholder="e.g. Fintech" />
        </div>
      </div>

      <div className="space-y-4">
        <FormField
          id="work-setup"
          orientation="horizontal"
          label="Work setup"
          error={preferenceErrors?.workSetup?.message}
        >
          {(controlProps) => (
            <Controller
              control={control}
              name="preferences.workSetup"
              render={({ field }) => (
                <OptionSelect
                  {...controlProps}
                  ref={field.ref}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  options={WORK_SETUP_LABELS}
                  placeholder="Select one"
                  className="w-full"
                />
              )}
            />
          )}
        </FormField>

        <FormField
          id="min-salary"
          orientation="horizontal"
          label="Min. salary (₱)"
          error={preferenceErrors?.minimumSalary?.message}
        >
          {(controlProps) => (
            <Input
              {...controlProps}
              {...register('preferences.minimumSalary')}
              type="number"
              min="0"
              placeholder="25000"
            />
          )}
        </FormField>
        <FormField
          id="max-salary"
          orientation="horizontal"
          label="Max. salary (₱)"
          error={preferenceErrors?.maximumSalary?.message}
        >
          {(controlProps) => (
            <Input
              {...controlProps}
              {...register('preferences.maximumSalary')}
              type="number"
              min="0"
              placeholder="45000"
            />
          )}
        </FormField>
        <FormField id="willing-to-relocate" orientation="horizontal" label="Willing to relocate?">
          {(controlProps) => (
            <Controller
              control={control}
              name="preferences.willingToRelocate"
              render={({ field }) => (
                <OptionSelect
                  {...controlProps}
                  ref={field.ref}
                  value={field.value ? 'yes' : 'no'}
                  onValueChange={(value) => field.onChange(value === 'yes')}
                  onBlur={field.onBlur}
                  options={YES_NO_LABELS}
                  className="w-full"
                />
              )}
            />
          )}
        </FormField>
        <FormField id="willing-to-remote" orientation="horizontal" label="Open to remote?">
          {(controlProps) => (
            <Controller
              control={control}
              name="preferences.willingToRemote"
              render={({ field }) => (
                <OptionSelect
                  {...controlProps}
                  ref={field.ref}
                  value={field.value ? 'yes' : 'no'}
                  onValueChange={(value) => field.onChange(value === 'yes')}
                  onBlur={field.onBlur}
                  options={YES_NO_LABELS}
                  className="w-full"
                />
              )}
            />
          )}
        </FormField>
      </div>
    </>
  )
}
