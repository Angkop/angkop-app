'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { Accordion as AccordionPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export function Accordion(props: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root {...props} />
}

export function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn('border-b border-border last:border-b-0', className)} {...props} />
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          'flex flex-1 cursor-pointer items-center gap-3 py-3 text-left text-sm transition-colors hover:text-foreground [&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        <span className="flex flex-1 items-center justify-between gap-4">{children}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content className="data-[state=closed]:hidden" {...props}>
      <div className={cn('pb-3', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}
