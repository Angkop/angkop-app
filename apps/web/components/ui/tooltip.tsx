'use client'

import * as React from 'react'
import { Tooltip as TooltipPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export function TooltipProvider(props: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={100} {...props} />
}

export function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props} />
}

export function TooltipTrigger(props: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger {...props} />
}

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'angkop-tooltip-content z-[60] overflow-hidden rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-balance text-primary-foreground shadow-md',
          'data-[state=delayed-open]:[animation:angkop-fade-in_150ms_ease-out]',
          'data-[state=closed]:[animation:angkop-fade-out_100ms_ease-in]',
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}
