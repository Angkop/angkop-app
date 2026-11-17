'use client'

import { useEffect, useRef, useState } from 'react'
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType } from '@angkop/shared'
import { FilterSelect } from '@/components/common/filter-select'
import type { FieldOption } from '@/components/common/form/types'
import { ChipList } from '@/components/chip-list'
import { OptionSelect } from '@/components/option-select'
import { ToggleChip } from '@/components/profile-fields/toggle-chip'
import { SAMPLE_SKILL_OPTIONS } from '../constants/sample-data'
import { PlaygroundSection, Variant } from './playground-section'

const SERVER_SEARCH_DELAY_MS = 600
const SERVER_RESULT_LIMIT = 10

export function SelectsFiltersSection() {
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('')
  const [multiValue, setMultiValue] = useState<string[]>([])
  const [activeValue, setActiveValue] = useState<string[]>(['React', 'SQL', 'Technical Writing'])
  const [singleValue, setSingleValue] = useState<string[]>([])
  const [serverValue, setServerValue] = useState<string[]>([])
  const [serverOptions, setServerOptions] = useState<FieldOption[]>(SAMPLE_SKILL_OPTIONS)
  const [isServerLoading, setIsServerLoading] = useState(false)
  const [chips, setChips] = useState(['Remote', 'Junior'])
  const [selectedChip, setSelectedChip] = useState(true)
  const serverTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(serverTimer.current), [])

  // Stands in for a query: the filter sends the typed text, and the "server" answers a moment later.
  function handleServerSearch(query: string) {
    clearTimeout(serverTimer.current)
    setIsServerLoading(true)
    serverTimer.current = setTimeout(() => {
      const needle = query.trim().toLowerCase()
      setServerOptions(
        SAMPLE_SKILL_OPTIONS.filter((option) => option.label.toLowerCase().includes(needle)).slice(
          0,
          SERVER_RESULT_LIMIT
        )
      )
      setIsServerLoading(false)
    }, SERVER_SEARCH_DELAY_MS)
  }

  return (
    <PlaygroundSection
      id='selects-filters'
      title='Selects and Filters'
      description='A filter pill starts inactive and shows a count once a value is applied. It lists a few options and searches for the rest, on the client or through a server query.'
    >
      <Variant label='Select over a label map' usage={'<OptionSelect options={EMPLOYMENT_TYPE_LABELS} />'}>
        <OptionSelect
          value={employmentType}
          onValueChange={setEmploymentType}
          options={EMPLOYMENT_TYPE_LABELS}
          placeholder='Employment type'
          aria-label='Employment type'
          className='w-full'
        />
      </Variant>
      <Variant label='Filter, inactive' usage={'<FilterSelect label="Skills" options value onValueChange />'}>
        <FilterSelect label='Skills' options={SAMPLE_SKILL_OPTIONS} value={multiValue} onValueChange={setMultiValue} />
      </Variant>
      <Variant
        label='Filter, active with a selection past the visible list'
        usage="value={['React', 'SQL', 'Technical Writing']}"
      >
        <FilterSelect
          label='Skills'
          options={SAMPLE_SKILL_OPTIONS}
          value={activeValue}
          onValueChange={setActiveValue}
        />
      </Variant>
      <Variant label='Filter, single choice' usage='multiple={false}'>
        <FilterSelect
          label='Skill'
          multiple={false}
          options={SAMPLE_SKILL_OPTIONS}
          value={singleValue}
          onValueChange={setSingleValue}
        />
      </Variant>
      <Variant label='Filter, server-side search' usage='onSearch={...} isLoading={...} options={serverResult}'>
        <FilterSelect
          label='Skills'
          options={serverOptions}
          value={serverValue}
          onValueChange={setServerValue}
          onSearch={handleServerSearch}
          isLoading={isServerLoading}
        />
      </Variant>
      <Variant label='Filter, loading' usage='isLoading'>
        <FilterSelect label='Skills' options={[]} value={[]} onValueChange={() => undefined} isLoading />
      </Variant>
      <Variant label='Filter, empty' usage='options={[]}'>
        <FilterSelect
          label='Skills'
          options={[]}
          value={[]}
          onValueChange={() => undefined}
          emptyMessage='No skills are listed yet. Run a job ingest to add some.'
        />
      </Variant>
      <Variant label='Filter, disabled' usage='disabled'>
        <FilterSelect
          label='Skills'
          options={SAMPLE_SKILL_OPTIONS}
          value={[]}
          onValueChange={() => undefined}
          disabled
        />
      </Variant>
      <Variant label='Toggle chip' usage={'<ToggleChip label selected onToggle />'}>
        <div className='flex flex-wrap gap-2'>
          <ToggleChip label='Remote' selected={selectedChip} onToggle={() => setSelectedChip((current) => !current)} />
          <ToggleChip label='Hybrid' selected={false} onToggle={() => undefined} />
        </div>
      </Variant>
      <Variant label='Chip list' usage={'<ChipList items onAdd onRemove placeholder />'}>
        <ChipList
          items={chips}
          onAdd={(value) => setChips((current) => [...current, value])}
          onRemove={(value) => setChips((current) => current.filter((item) => item !== value))}
          placeholder='Add a tag'
        />
      </Variant>
    </PlaygroundSection>
  )
}
