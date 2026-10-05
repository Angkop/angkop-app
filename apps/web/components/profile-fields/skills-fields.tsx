import type { Dispatch, SetStateAction } from 'react'
import { SKILL_LEVEL_LABELS, type SkillLevel } from '@angkop/shared'
import { ChipList } from '@/components/chip-list'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ProfileSkillEntry } from '@/lib/profile-form'

export function SkillsFields({
  skills,
  setSkills
}: {
  skills: ProfileSkillEntry[]
  setSkills: Dispatch<SetStateAction<ProfileSkillEntry[]>>
}) {
  return (
    <>
      <div className="rounded-lg border border-border p-4">
        <ChipList
          items={skills.map((skill) => skill.name)}
          onAdd={(value) => setSkills((prev) => [...prev, { name: value }])}
          onRemove={(value) => setSkills((prev) => prev.filter((skill) => skill.name !== value))}
          placeholder="e.g. React"
        />
        {skills.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No skills yet — matches will lean on your resume once you upload it.
          </p>
        ) : null}
      </div>

      {skills.length > 0 ? (
        <div className="space-y-2">
          {skills.map((skill, index) => (
            <div
              key={skill.name}
              className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
            >
              <span className="flex-1 truncate text-sm font-medium text-foreground">{skill.name}</span>
              <Select
                value={skill.level ?? ''}
                onValueChange={(value) =>
                  setSkills((prev) => prev.map((item, i) => (i === index ? { ...item, level: value as SkillLevel } : item)))
                }
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(SKILL_LEVEL_LABELS) as [SkillLevel, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={skill.years ?? ''}
                onChange={(event) =>
                  setSkills((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, years: event.target.value ? Number(event.target.value) : undefined } : item
                    )
                  )
                }
                placeholder="Years"
                className="w-full sm:w-20"
              />
            </div>
          ))}
        </div>
      ) : null}
    </>
  )
}
