'use client'

import type { ComponentProps } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// A select over a { value: label } record, like the label maps in @angkop/shared. Trigger
// props (id, aria-*, className, ref) pass straight through so it works inside FormField and
// react-hook-form's Controller.
export function OptionSelect<T extends string>({
  value,
  onValueChange,
  options,
  placeholder,
  ...triggerProps
}: {
  value: T | '' | undefined
  onValueChange: (value: T) => void
  options: Record<T, string>
  placeholder?: string
} & Omit<ComponentProps<typeof SelectTrigger>, 'children' | 'value' | 'onChange'>) {
  return (
    <Select value={value ?? ''} onValueChange={(next) => onValueChange(next as T)}>
      <SelectTrigger {...triggerProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(options) as [T, string][]).map(([optionValue, label]) => (
          <SelectItem key={optionValue} value={optionValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
