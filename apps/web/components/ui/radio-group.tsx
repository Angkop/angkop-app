'use client'

import * as React from 'react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} />
}

export function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'aspect-square size-[18px] shrink-0 cursor-pointer rounded-full border-2 border-muted-foreground/50 bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[state=checked]:border-primary',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className='flex items-center justify-center'>
        <span className='size-2.5 rounded-full bg-primary' />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}
