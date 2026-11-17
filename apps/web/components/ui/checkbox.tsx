'use client'

import * as React from 'react'
import { Checkbox as CheckboxPrimitive } from 'radix-ui'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer size-[18px] shrink-0 cursor-pointer rounded-[4px] border-2 border-muted-foreground/50 bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className='flex items-center justify-center text-current'>
        <CheckIcon className='size-3.5' strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
