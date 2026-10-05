import type { Dispatch, SetStateAction } from 'react'
import { EMPLOYMENT_TYPE_LABELS, WORK_SETUP_LABELS, type EmploymentType, type WorkSetup } from '@angkop/shared'
import { ChipList } from '@/components/chip-list'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PreferencesEntry } from '@/lib/onboarding-profile'
import { StepSection } from './step-section'
import { ToggleChip } from './toggle-chip'

export function PreferencesStep({
  preferences,
  setPreferences
}: {
  preferences: PreferencesEntry
  setPreferences: Dispatch<SetStateAction<PreferencesEntry>>
}) {
  return (
    <StepSection
      title="What are you looking for?"
      description="This keeps your matches from scoring high on skills alone when the location or setup doesn't fit."
    >
      <div className="space-y-1.5">
        <Label>Desired roles</Label>
        <div className="rounded-lg border border-border p-4">
          <ChipList
            items={preferences.desiredRoles}
            onAdd={(value) => setPreferences((prev) => ({ ...prev, desiredRoles: [...prev.desiredRoles, value] }))}
            onRemove={(value) =>
              setPreferences((prev) => ({
                ...prev,
                desiredRoles: prev.desiredRoles.filter((role) => role !== value)
              }))
            }
            placeholder="e.g. Frontend Developer"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Preferred locations</Label>
        <div className="rounded-lg border border-border p-4">
          <ChipList
            items={preferences.preferredLocations}
            onAdd={(value) =>
              setPreferences((prev) => ({
                ...prev,
                preferredLocations: [...prev.preferredLocations, value]
              }))
            }
            onRemove={(value) =>
              setPreferences((prev) => ({
                ...prev,
                preferredLocations: prev.preferredLocations.filter((loc) => loc !== value)
              }))
            }
            placeholder="e.g. Metro Manila"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Job types</Label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(([value, label]) => (
            <ToggleChip
              key={value}
              label={label}
              selected={preferences.preferredJobTypes.includes(value)}
              onToggle={() =>
                setPreferences((prev) => ({
                  ...prev,
                  preferredJobTypes: prev.preferredJobTypes.includes(value)
                    ? prev.preferredJobTypes.filter((type) => type !== value)
                    : [...prev.preferredJobTypes, value]
                }))
              }
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Preferred industries</Label>
        <div className="rounded-lg border border-border p-4">
          <ChipList
            items={preferences.preferredIndustries}
            onAdd={(value) =>
              setPreferences((prev) => ({
                ...prev,
                preferredIndustries: [...prev.preferredIndustries, value]
              }))
            }
            onRemove={(value) =>
              setPreferences((prev) => ({
                ...prev,
                preferredIndustries: prev.preferredIndustries.filter((industry) => industry !== value)
              }))
            }
            placeholder="e.g. Fintech"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="work-setup">Work setup</Label>
          <Select
            value={preferences.workSetup ?? ''}
            onValueChange={(value) => setPreferences((prev) => ({ ...prev, workSetup: value as WorkSetup }))}
          >
            <SelectTrigger id="work-setup" className="w-full">
              <SelectValue placeholder="Select one" />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(WORK_SETUP_LABELS) as [WorkSetup, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="min-salary">Min. salary (₱)</Label>
            <Input
              id="min-salary"
              type="number"
              min="0"
              value={preferences.minimumSalary}
              onChange={(event) => setPreferences((prev) => ({ ...prev, minimumSalary: event.target.value }))}
              placeholder="25000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="max-salary">Max. salary (₱)</Label>
            <Input
              id="max-salary"
              type="number"
              min="0"
              value={preferences.maximumSalary}
              onChange={(event) => setPreferences((prev) => ({ ...prev, maximumSalary: event.target.value }))}
              placeholder="45000"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="willing-to-relocate">Willing to relocate?</Label>
          <Select
            value={preferences.willingToRelocate ? 'yes' : 'no'}
            onValueChange={(value) => setPreferences((prev) => ({ ...prev, willingToRelocate: value === 'yes' }))}
          >
            <SelectTrigger id="willing-to-relocate" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="willing-to-remote">Open to remote?</Label>
          <Select
            value={preferences.willingToRemote ? 'yes' : 'no'}
            onValueChange={(value) => setPreferences((prev) => ({ ...prev, willingToRemote: value === 'yes' }))}
          >
            <SelectTrigger id="willing-to-remote" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </StepSection>
  )
}
