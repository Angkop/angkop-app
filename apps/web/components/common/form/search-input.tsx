'use client'

import type { ComponentProps } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// A text input with a search icon and a clear button. It is a plain controlled input, so the
// caller decides when the value is applied: debounce it before it goes into query variables.
export function SearchInput({
  value,
  onValueChange,
  clearLabel = 'Clear search',
  className,
  disabled,
  ...inputProps
}: {
  value: string
  onValueChange: (value: string) => void
  clearLabel?: string
} & Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'>) {
  return (
    <div className={cn('relative', className)}>
      <Search className='pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground' />
      <Input
        {...inputProps}
        type='search'
        value={value}
        disabled={disabled}
        onChange={(event) => onValueChange(event.target.value)}
        className='pr-8 pl-8 [&::-webkit-search-cancel-button]:appearance-none'
      />
      {value && !disabled ? (
        <button
          type='button'
          aria-label={clearLabel}
          onClick={() => onValueChange('')}
          className='absolute top-1/2 right-2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
        >
          <X className='size-3.5' />
        </button>
      ) : null}
    </div>
  )
}
