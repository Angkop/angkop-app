'use client'

import * as React from 'react'
import { Switch as SwitchPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border p-px outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=unchecked]:border-muted-foreground/50 data-[state=unchecked]:bg-muted',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className='pointer-events-none block size-[18px] rounded-full bg-background shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0' />
    </SwitchPrimitive.Root>
  )
}
