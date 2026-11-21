'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { SearchInput } from '@/components/common/form/search-input'
import type { FieldOption } from '@/components/common/form/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const DEFAULT_VISIBLE_COUNT = 6
const MAX_SEARCH_RESULTS = 50
const SEARCH_DEBOUNCE_MS = 300
const LOADING_ROWS = 6

// A filter pill that opens a searchable option list. It starts inactive (label and arrow) and
// turns active once a value is applied. By default it lists the first `visibleCount` options and
// the search box finds the rest. Pass `onSearch` to filter on the server: the typed text goes
// out debounced, `options` is expected to be the server's answer, and nothing is filtered here.
// Selected values stay in the list even when the search no longer returns them, so an active
// filter is always visible and easy to remove.
export function FilterSelect({
  label,
  options,
  value,
  onValueChange,
  multiple = true,
  visibleCount = DEFAULT_VISIBLE_COUNT,
  searchPlaceholder = 'Search options',
  emptyMessage = 'No options match this search. Try a different word.',
  onSearch,
  isLoading = false,
  disabled = false,
  className
}: {
  label: string
  options: FieldOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  multiple?: boolean
  visibleCount?: number
  searchPlaceholder?: string
  emptyMessage?: string
  onSearch?: (query: string) => void
  isLoading?: boolean
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  // True from the keystroke until the debounced search is sent: the list on screen is for the old
  // text, so it is replaced by the loading rows right away instead of lingering for the debounce.
  const [isDebouncing, setIsDebouncing] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(searchTimer.current), [])

  const trimmedQuery = query.trim().toLowerCase()
  const selected = new Set(value)
  const labelByValue = new Map(options.map((option) => [option.value, option.label]))

  const matches =
    onSearch || !trimmedQuery ? options : options.filter((option) => option.label.toLowerCase().includes(trimmedQuery))
  const limit = trimmedQuery ? MAX_SEARCH_RESULTS : visibleCount
  const shown = matches.slice(0, limit)
  const shownValues = new Set(shown.map((option) => option.value))
  const pinned = value
    .filter((selectedValue) => !shownValues.has(selectedValue))
    .map((selectedValue) => ({ value: selectedValue, label: labelByValue.get(selectedValue) ?? selectedValue }))
  const rows = [...pinned, ...shown]
  const hiddenCount = Math.max(0, matches.length - shown.length)

  const isShowingLoading = isLoading || isDebouncing
  const isActive = value.length > 0
  const activeText = multiple ? undefined : (labelByValue.get(value[0]) ?? value[0])

  function handleQueryChange(next: string) {
    setQuery(next)
    if (!onSearch) return
    clearTimeout(searchTimer.current)
    setIsDebouncing(next.trim().length > 0)
    searchTimer.current = setTimeout(() => {
      setIsDebouncing(false)
      onSearch(next)
    }, SEARCH_DEBOUNCE_MS)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) return
    clearTimeout(searchTimer.current)
    setIsDebouncing(false)
    if (query) {
      setQuery('')
      onSearch?.('')
    }
  }

  function toggle(optionValue: string) {
    if (multiple) {
      onValueChange(selected.has(optionValue) ? value.filter((item) => item !== optionValue) : [...value, optionValue])
      return
    }
    onValueChange(selected.has(optionValue) ? [] : [optionValue])
    handleOpenChange(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={disabled}
          aria-label={isActive ? `${label}, ${value.length} selected` : label}
          className={cn(
            'justify-between gap-1.5 font-normal',
            isActive
              ? 'border-primary/40 bg-accent text-accent-foreground'
              : 'border-input text-muted-foreground hover:text-foreground',
            className
          )}
        >
          <span className='truncate'>{activeText ?? label}</span>
          {isActive && multiple ? (
            <span className='flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground tabular-nums'>
              {value.length}
            </span>
          ) : null}
          <ChevronDown className='size-3.5 shrink-0' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='space-y-2 p-2'>
        <SearchInput
          value={query}
          onValueChange={handleQueryChange}
          placeholder={searchPlaceholder}
          aria-label={`Search ${label}`}
        />
        <div className='max-h-60 overflow-y-auto'>
          {isShowingLoading ? (
            <div className='space-y-1.5 p-1' role='status' aria-label='Loading options'>
              {Array.from({ length: LOADING_ROWS }, (_, index) => (
                <Skeleton key={index} className='h-9' />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className='px-2 py-4 text-center text-xs text-muted-foreground'>{emptyMessage}</p>
          ) : (
            rows.map((option) =>
              multiple ? (
                <label
                  key={option.value}
                  className='mb-1 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm last:mb-0 hover:bg-accent'
                >
                  <Checkbox checked={selected.has(option.value)} onCheckedChange={() => toggle(option.value)} />
                  <span className='min-w-0 flex-1 truncate'>{option.label}</span>
                </label>
              ) : (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => toggle(option.value)}
                  className={cn(
                    'mb-1 flex w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm outline-none last:mb-0 hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary',
                    selected.has(option.value) && 'bg-primary/10'
                  )}
                >
                  <span className='min-w-0 flex-1 truncate'>{option.label}</span>
                  {selected.has(option.value) ? <Check className='size-4 shrink-0' /> : null}
                </button>
              )
            )
          )}
        </div>
        {hiddenCount > 0 && !isShowingLoading ? (
          <p className='px-2 text-xs text-muted-foreground'>
            {trimmedQuery
              ? `Showing the first ${shown.length} results. Type more to narrow them.`
              : `Showing ${shown.length} of ${matches.length}. Search to find the rest.`}
          </p>
        ) : null}
        {isActive ? (
          <div className='border-t border-border pt-2'>
            <Button type='button' variant='ghost' size='sm' onClick={() => onValueChange([])}>
              Clear {label}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}
