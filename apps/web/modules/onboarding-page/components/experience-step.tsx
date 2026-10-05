import { Plus, X } from 'lucide-react'
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType } from '@angkop/shared'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ExperienceEntry } from '@/lib/onboarding-profile'
import type { ArrayHelpers } from '../utils'
import { StepSection } from './step-section'

export function ExperienceStep({
  experience,
  experienceHelpers
}: {
  experience: ExperienceEntry[]
  experienceHelpers: ArrayHelpers<ExperienceEntry>
}) {
  return (
    <StepSection
      title="Work experience"
      description="Internships count. Leave this empty if you don't have any yet — we'll match mostly on your skills and projects."
    >
      <div className="space-y-3">
        {experience.map((item, index) => (
          <div key={index} className="space-y-2 rounded-lg border border-border p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={item.title}
                onChange={(event) => experienceHelpers.update(index, 'title', event.target.value)}
                placeholder="Job title"
              />
              <Input
                value={item.company}
                onChange={(event) => experienceHelpers.update(index, 'company', event.target.value)}
                placeholder="Company"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={item.location}
                onChange={(event) => experienceHelpers.update(index, 'location', event.target.value)}
                placeholder="Location (optional)"
              />
              <Select
                value={item.employmentType ?? ''}
                onValueChange={(value) => experienceHelpers.update(index, 'employmentType', value as EmploymentType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Employment type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid items-center gap-2 sm:grid-cols-3">
              <Input
                type="month"
                value={item.startDate}
                onChange={(event) => experienceHelpers.update(index, 'startDate', event.target.value)}
              />
              <Input
                type="month"
                value={item.endDate}
                onChange={(event) => experienceHelpers.update(index, 'endDate', event.target.value)}
                disabled={item.current}
                placeholder="End date"
              />
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={item.current}
                    onChange={(event) => experienceHelpers.update(index, 'current', event.target.checked)}
                    className="size-4 rounded border-input accent-primary"
                  />
                  Current
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove experience entry"
                  onClick={() => experienceHelpers.remove(index)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={item.description}
              onChange={(event) => experienceHelpers.update(index, 'description', event.target.value)}
              placeholder="What did you work on? (optional, but helps your matches)"
              rows={2}
            />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={experienceHelpers.add}>
          <Plus className="size-3.5" />
          Add experience
        </Button>
      </div>
    </StepSection>
  )
}
