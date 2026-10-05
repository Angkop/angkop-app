'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Dialog as SheetPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export function Sheet(props: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root {...props} />
}

export function SheetTrigger(props: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger {...props} />
}

export function SheetContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { showCloseButton?: boolean }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        className={cn(
          'angkop-sheet-overlay fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]',
          'data-[state=open]:[animation:angkop-fade-in_200ms_ease-out]',
          'data-[state=closed]:[animation:angkop-fade-out_200ms_ease-in]'
        )}
      />
      <SheetPrimitive.Content
        className={cn(
          'angkop-sheet-content fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border bg-card shadow-xl',
          'sm:max-w-2xl',
          'data-[state=open]:[animation:angkop-sheet-slide-in_280ms_cubic-bezier(0.32,0.72,0,1)]',
          'data-[state=closed]:[animation:angkop-sheet-slide-out_220ms_ease-in]',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            aria-label="Close"
            className="absolute top-4 right-4 cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

export function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex shrink-0 items-center gap-3 border-b border-border px-5 py-4', className)}
      {...props}
    />
  )
}

export function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title className={cn('text-base font-semibold text-foreground', className)} {...props} />
  )
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex-1 overflow-y-auto px-5 py-5', className)} {...props} />
}
