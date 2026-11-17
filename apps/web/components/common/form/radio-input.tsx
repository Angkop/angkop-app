'use client'

import type { ComponentProps } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { FieldOption } from './types'

export function RadioInput({
  id,
  value,
  onValueChange,
  options,
  orientation = 'vertical',
  className,
  ...groupProps
}: {
  id: string
  value: string | undefined
  onValueChange: (value: string) => void
  options: FieldOption[]
  orientation?: 'vertical' | 'horizontal'
} & Omit<ComponentProps<typeof RadioGroup>, 'id' | 'value' | 'onValueChange' | 'children' | 'orientation'>) {
  return (
    <RadioGroup
      {...groupProps}
      id={id}
      value={value ?? ''}
      onValueChange={onValueChange}
      orientation={orientation}
      className={cn(orientation === 'horizontal' && 'flex flex-wrap gap-x-4', className)}
    >
      {options.map((option) => (
        <div key={option.value} className='flex items-center gap-2'>
          <RadioGroupItem
            id={`${id}-${option.value}`}
            value={option.value}
            disabled={option.disabled}
            aria-invalid={groupProps['aria-invalid']}
          />
          <Label htmlFor={`${id}-${option.value}`} className='font-normal'>
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}
