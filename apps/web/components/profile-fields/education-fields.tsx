import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import type { ArrayHelpers, EducationEntry } from '@/lib/profile-form'

export function EducationFields({
  education,
  educationHelpers
}: {
  education: EducationEntry[]
  educationHelpers: ArrayHelpers<EducationEntry>
}) {
  return (
    <div className="space-y-3">
      {education.map((item, index) => (
        <div key={index} className="space-y-2 rounded-lg border border-border p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={item.school}
              onChange={(event) => educationHelpers.update(index, 'school', event.target.value)}
              placeholder="School"
            />
            <Input
              value={item.degree}
              onChange={(event) => educationHelpers.update(index, 'degree', event.target.value)}
              placeholder="Degree (e.g. Bachelor of Science)"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              value={item.fieldOfStudy}
              onChange={(event) => educationHelpers.update(index, 'fieldOfStudy', event.target.value)}
              placeholder="Field of study (e.g. Computer Science)"
              className="sm:col-span-1"
            />
            <Input
              type="number"
              value={item.startYear}
              onChange={(event) => educationHelpers.update(index, 'startYear', event.target.value)}
              placeholder="Start year"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                value={item.endYear}
                onChange={(event) => educationHelpers.update(index, 'endYear', event.target.value)}
                placeholder="End year"
              />
              {education.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove education entry"
                  onClick={() => educationHelpers.remove(index)}
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          </div>
          <Textarea
            value={item.description}
            onChange={(event) => educationHelpers.update(index, 'description', event.target.value)}
            placeholder="Relevant coursework, honors, activities (optional)"
            rows={2}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={educationHelpers.add}>
        <Plus className="size-3.5" />
        Add education
      </Button>
    </div>
  )
}
