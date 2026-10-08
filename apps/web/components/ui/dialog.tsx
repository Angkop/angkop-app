'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

export function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />
}

export function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />
}

export function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'angkop-dialog-overlay fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]',
          'data-[state=open]:[animation:angkop-fade-in_200ms_ease-out]',
          'data-[state=closed]:[animation:angkop-fade-out_150ms_ease-in]'
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          'angkop-dialog-content fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
          'rounded-2xl border border-border bg-card p-6 shadow-xl',
          'max-h-[calc(100vh-2rem)] overflow-y-auto',
          'data-[state=open]:[animation:angkop-dialog-in_200ms_ease-out]',
          'data-[state=closed]:[animation:angkop-dialog-out_150ms_ease-in]',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-4 right-4 cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mb-4 space-y-1.5', className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title className={cn('text-base font-semibold text-foreground', className)} {...props} />
  )
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('mt-6 flex flex-wrap items-center justify-end gap-3', className)} {...props} />
  )
}
