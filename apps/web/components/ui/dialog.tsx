'use client'

import * as React from 'react'
import { X, type LucideIcon } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

const DIALOG_ICON_BADGE_VARIANTS = {
  primary: 'bg-primary/10 text-primary',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground'
} as const

// A dialog's icon badge names its purpose at a glance (import, confirm, insight, course)
// instead of every dialog opening on identical, undifferentiated chrome.
export function DialogIconBadge({
  icon: Icon,
  variant = 'primary'
}: {
  icon: LucideIcon
  variant?: keyof typeof DIALOG_ICON_BADGE_VARIANTS
}) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full',
        DIALOG_ICON_BADGE_VARIANTS[variant]
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}

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
          'angkop-dialog-overlay fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
          'data-[state=open]:[animation:angkop-fade-in_200ms_ease-out]',
          'data-[state=closed]:[animation:angkop-fade-out_150ms_ease-in]'
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          'angkop-dialog-content fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-[456px] -translate-x-1/2 -translate-y-1/2',
          'rounded-xl border border-border bg-card p-0 shadow-2xl',
          'max-h-[calc(100vh-60px)] overflow-y-auto',
          // Everything between the header and footer gets the 24px side padding, so a dialog's
          // body does not have to know it is inside one.
          '[&>*:not([data-slot=dialog-header]):not([data-slot=dialog-footer]):not(button)]:px-6',
          // On a phone the dialog becomes a bottom sheet.
          'max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:max-h-[90dvh] max-sm:rounded-t-3xl max-sm:rounded-b-none',
          'data-[state=open]:[animation:angkop-dialog-in_240ms_cubic-bezier(0.16,1,0.3,1)]',
          'data-[state=closed]:[animation:angkop-dialog-out_150ms_ease-in]',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-6 right-6 cursor-pointer rounded-full bg-background p-1 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('mb-6 space-y-1.5 bg-accent py-6 pr-16 pl-6', className)}
      {...props}
    />
  )
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('font-display text-xl font-bold tracking-tight text-foreground', className)}
      {...props}
    />
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
    <div
      data-slot="dialog-footer"
      className={cn('mt-6 flex items-center gap-3 p-6 [&>*]:h-[42px] [&>*]:flex-1 [&>*]:text-[15px]', className)}
      {...props}
    />
  )
}
