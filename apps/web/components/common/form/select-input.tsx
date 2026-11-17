'use client'

import type { ComponentProps } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { FieldOption } from './types'

// A select over a FieldOption list. Trigger props (id, aria-*, className, ref) pass straight
// through so it works inside FormField and react-hook-form's Controller.
export function SelectInput({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  ...triggerProps
}: {
  value: string | undefined
  onValueChange: (value: string) => void
  options: FieldOption[]
  placeholder?: string
  disabled?: boolean
} & Omit<ComponentProps<typeof SelectTrigger>, 'children' | 'value' | 'onChange' | 'disabled'>) {
  return (
    <Select value={value ?? ''} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger {...triggerProps}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
