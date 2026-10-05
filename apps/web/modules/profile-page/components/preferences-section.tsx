import { FileText } from 'lucide-react'
import { WORK_SETUP_LABELS } from '@angkop/shared'
import { Badge } from '@/components/ui/badge'
import { formatSalaryRange } from '../utils'
import type { MeProfile } from '../types'

export function PreferencesSection({
  preferences,
  resumeFileName
}: {
  preferences: MeProfile['preferences']
  resumeFileName: string | null | undefined
}) {
  const salaryRange = preferences ? formatSalaryRange(preferences.minimumSalary, preferences.maximumSalary) : null

  return (
    <div className="mt-4 rounded-lg border border-border p-5">
      <h2 className="text-sm font-semibold text-foreground">Looking for</h2>
      {preferences && preferences.desiredRoles.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {preferences.desiredRoles.map((role) => (
            <Badge key={role} variant="secondary">
              {role}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No desired roles added yet.</p>
      )}

      {preferences ? (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
          {preferences.preferredLocations.length > 0 ? (
            <span>Locations: {preferences.preferredLocations.join(', ')}</span>
          ) : null}
          {preferences.workSetup ? <span>Setup: {WORK_SETUP_LABELS[preferences.workSetup]}</span> : null}
          {salaryRange ? <span>Salary: {salaryRange}</span> : null}
          <span>Relocate: {preferences.willingToRelocate ? 'Yes' : 'No'}</span>
          <span>Remote: {preferences.willingToRemote ? 'Yes' : 'No'}</span>
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-foreground">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        {resumeFileName || 'No resume uploaded'}
      </div>
    </div>
  )
}
