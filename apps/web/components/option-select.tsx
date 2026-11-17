'use client'

import type { ComponentProps } from 'react'
import { SelectInput } from '@/components/common/form/select-input'

// A select over a { value: label } record, like the label maps in @angkop/shared. A thin
// adapter over SelectInput, which takes a FieldOption list. Trigger props (id, aria-*,
// className, ref) pass straight through so it works inside FormField and react-hook-form's
// Controller.
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
} & Omit<ComponentProps<typeof SelectInput>, 'value' | 'onValueChange' | 'options' | 'placeholder'>) {
  return (
    <SelectInput
      {...triggerProps}
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      placeholder={placeholder}
      options={(Object.entries(options) as [T, string][]).map(([optionValue, label]) => ({
        value: optionValue,
        label
      }))}
    />
  )
}
