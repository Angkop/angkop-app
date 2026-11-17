import { Controller, useFormContext } from 'react-hook-form'
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType } from '@angkop/shared'
import { FIELD_TYPE } from '@/components/common/form/constants/field-type'
import { Label } from '@/components/ui/label'
import { WORK_SETUP_OPTIONS } from '@/constants/profile-form'
import type { ProfileFormValues } from '@/lib/profile-form'
import { ChipListField } from './chip-list-field'
import { ProfileField } from './profile-field'
import { ToggleChip } from './toggle-chip'

export function PreferencesFields() {
  const { control } = useFormContext<ProfileFormValues>()

  return (
    <>
      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-muted-foreground">Desired roles</Label>
        <div className="rounded-lg border border-border p-4">
          <ChipListField name="preferences.desiredRoles" placeholder="e.g. Frontend Developer" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-muted-foreground">Preferred locations</Label>
        <div className="rounded-lg border border-border p-4">
          <ChipListField name="preferences.preferredLocations" placeholder="e.g. Metro Manila" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-normal text-muted-foreground">Job types</Label>
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
        <Label className="text-xs font-normal text-muted-foreground">Preferred industries</Label>
        <div className="rounded-lg border border-border p-4">
          <ChipListField name="preferences.preferredIndustries" placeholder="e.g. Fintech" />
        </div>
      </div>

      <div className="space-y-4">
        <ProfileField
          fieldType={FIELD_TYPE.SELECT}
          name="preferences.workSetup"
          label="Work setup"
          orientation="horizontal"
          options={WORK_SETUP_OPTIONS}
          placeholder="Select one"
        />
        <ProfileField
          fieldType={FIELD_TYPE.AMOUNT}
          name="preferences.minimumSalary"
          label="Min. salary (₱)"
          orientation="horizontal"
          placeholder="25,000"
        />
        <ProfileField
          fieldType={FIELD_TYPE.AMOUNT}
          name="preferences.maximumSalary"
          label="Max. salary (₱)"
          orientation="horizontal"
          placeholder="45,000"
        />
        <ProfileField
          fieldType={FIELD_TYPE.SWITCH}
          name="preferences.willingToRelocate"
          label="Willing to relocate"
        />
        <ProfileField fieldType={FIELD_TYPE.SWITCH} name="preferences.willingToRemote" label="Open to remote" />
      </div>
    </>
  )
}
