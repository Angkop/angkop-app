'use client'

import * as React from 'react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root {...props} />
}

export function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn('text-base font-medium text-foreground', className)} {...props} />
}

export function SheetContent({
  className,
  children,
  side = 'left',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { side?: 'left' | 'right' }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20" />
      <SheetPrimitive.Content
        className={cn(
          'fixed inset-y-0 z-50 flex h-full w-3/4 max-w-xs flex-col gap-4 border-border bg-popover text-popover-foreground shadow-lg',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          className
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close asChild>
          <button
            type="button"
            aria-label="Close"
            className="absolute top-3 right-3 rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}
