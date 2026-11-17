'use client'

import * as React from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root {...props} />
}

export function PopoverTrigger(props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger {...props} />
}

export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg outline-none',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
