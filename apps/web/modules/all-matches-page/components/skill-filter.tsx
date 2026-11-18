import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { SKILL_PILL_COUNT } from '../constants'

// The blog template's tag filter: a row of pills, "All" first. Only the first few skills get a
// pill; the rest sit behind a menu so a long skill list doesn't bury the grid.
export function SkillFilter({
  skills,
  selected,
  onSelect
}: {
  skills: string[]
  selected: string
  onSelect: (skill: string) => void
}) {
  const pills = skills.slice(0, SKILL_PILL_COUNT)
  const moreSkills = skills.slice(SKILL_PILL_COUNT)
  // A skill picked from the menu stays visible as a pressed pill so it can be switched off.
  const extraPill = selected !== ALL_FILTER_VALUE && !pills.includes(selected) ? selected : null

  return (
    <div role="group" aria-label="Filter by skill" className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="chip"
        size="chip"
        aria-pressed={selected === ALL_FILTER_VALUE}
        onClick={() => onSelect(ALL_FILTER_VALUE)}
      >
        All
      </Button>
      {[...pills, ...(extraPill ? [extraPill] : [])].map((skill) => (
        <Button
          key={skill}
          type="button"
          variant="chip"
          size="chip"
          aria-pressed={selected === skill}
          onClick={() => onSelect(selected === skill ? ALL_FILTER_VALUE : skill)}
        >
          {skill}
        </Button>
      ))}
      {moreSkills.length > 0 ? (
        // Always controlled to '' so it keeps reading "More skills" after a pick.
        <Select value="" onValueChange={onSelect}>
          <SelectTrigger aria-label="More skills" className="h-7 rounded-full px-2.5 py-1 text-xs">
            <SelectValue placeholder="More skills" />
          </SelectTrigger>
          <SelectContent>
            {moreSkills.map((skill) => (
              <SelectItem key={skill} value={skill}>
                {skill}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  )
}
