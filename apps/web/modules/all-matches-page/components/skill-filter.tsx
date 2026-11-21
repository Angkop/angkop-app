import { useMemo } from 'react'
import { FilterSelect } from '@/components/common/filter-select'
import { Button } from '@/components/ui/button'
import { ALL_FILTER_VALUE } from '@/constants/filters'
import { SKILL_OPTION_COUNT } from '@/constants/skills'
import { SKILL_PILL_COUNT } from '../constants'

// The blog template's tag filter: a row of pills, "All" first. Only the first few skills get a
// pill; "More skills" lists the next few and searches the server for the rest, so the page never
// loads or renders the whole skill list.
export function SkillFilter({
  skills,
  searchResults,
  isSearching,
  selected,
  onSelect,
  onSearch
}: {
  // The most-asked skills: the first few become pills, the next few are the dropdown's defaults.
  skills: string[]
  // What the server returned for the text typed in the dropdown, or null while nothing is typed.
  searchResults: string[] | null
  isSearching: boolean
  selected: string
  onSelect: (skill: string) => void
  onSearch: (query: string) => void
}) {
  const pills = skills.slice(0, SKILL_PILL_COUNT)
  // A skill picked from the menu stays visible as a pressed pill so it can be switched off.
  const extraPill = selected !== ALL_FILTER_VALUE && !pills.includes(selected) ? selected : null

  const moreOptions = useMemo(
    () => (searchResults ?? skills.slice(SKILL_PILL_COUNT)).map((skill) => ({ value: skill, label: skill })),
    [searchResults, skills]
  )

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
      {skills.length > pills.length ? (
        // Always controlled to [] so it keeps reading "More skills" after a pick; the picked skill
        // shows as a pill instead.
        <FilterSelect
          label="More skills"
          multiple={false}
          options={moreOptions}
          value={[]}
          onValueChange={(next) => {
            if (next[0]) onSelect(next[0])
          }}
          visibleCount={SKILL_OPTION_COUNT}
          searchPlaceholder="Search skills"
          emptyMessage="No skills match this search. Try a different word."
          onSearch={onSearch}
          isLoading={isSearching}
          className="h-7 rounded-full px-2.5 py-1 text-xs"
        />
      ) : null}
    </div>
  )
}
