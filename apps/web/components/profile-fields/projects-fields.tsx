import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChipList } from '@/components/chip-list'
import { Input, Textarea } from '@/components/ui/input'
import type { ArrayHelpers, ProjectEntry } from '@/lib/profile-form'

export function ProjectsFields({
  projects,
  projectHelpers
}: {
  projects: ProjectEntry[]
  projectHelpers: ArrayHelpers<ProjectEntry>
}) {
  return (
    <div className="space-y-3">
      {projects.map((item, index) => (
        <div key={index} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex items-center gap-2">
            <Input
              value={item.name}
              onChange={(event) => projectHelpers.update(index, 'name', event.target.value)}
              placeholder="Project name"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove project"
              onClick={() => projectHelpers.remove(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <Textarea
            value={item.description}
            onChange={(event) => projectHelpers.update(index, 'description', event.target.value)}
            placeholder="What does it do, and what did you build?"
            rows={2}
          />
          <ChipList
            items={item.technologies}
            onAdd={(value) => projectHelpers.update(index, 'technologies', [...item.technologies, value])}
            onRemove={(value) =>
              projectHelpers.update(
                index,
                'technologies',
                item.technologies.filter((tech) => tech !== value)
              )
            }
            placeholder="e.g. Next.js"
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <Input
              value={item.url}
              onChange={(event) => projectHelpers.update(index, 'url', event.target.value)}
              placeholder="Link (optional)"
              className="sm:col-span-1"
            />
            <Input
              type="month"
              value={item.startDate}
              onChange={(event) => projectHelpers.update(index, 'startDate', event.target.value)}
            />
            <Input
              type="month"
              value={item.endDate}
              onChange={(event) => projectHelpers.update(index, 'endDate', event.target.value)}
              placeholder="End date (optional)"
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={projectHelpers.add}>
        <Plus className="size-3.5" />
        Add project
      </Button>
    </div>
  )
}
