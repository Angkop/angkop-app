'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

const DIALOG_SIZE_CLASS_NAMES = {
  xs: 'max-w-[360px]',
  sm: 'max-w-[456px]',
  md: 'max-w-[676px]',
  lg: 'max-w-[1200px]',
  xl: 'max-w-[1400px]'
} as const

export type DialogSize = keyof typeof DIALOG_SIZE_CLASS_NAMES

export function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root {...props} />
}

export function DialogTrigger(props: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger {...props} />
}

export function DialogClose(props: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close {...props} />
}

// A dialog is a header (title, description, close), a body and a footer of actions. The body is
// whatever sits between the header and footer, and gets the 24px side padding here so it does
// not have to know it is inside a dialog. `size` sets the max width; on a phone the dialog
// becomes a bottom sheet instead.
export function DialogContent({
  className,
  children,
  size = 'sm',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { size?: DialogSize }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'angkop-dialog-overlay fixed inset-0 z-50 bg-black/40',
          'data-[state=open]:[animation:angkop-fade-in_200ms_ease-out]',
          'data-[state=closed]:[animation:angkop-fade-out_150ms_ease-in]'
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          'angkop-dialog-content fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
          DIALOG_SIZE_CLASS_NAMES[size],
          'rounded-md bg-card p-0 shadow-xl outline-none',
          'max-h-[calc(100vh-60px)] overflow-y-auto',
          '[&>*:not([data-slot=dialog-header]):not([data-slot=dialog-footer])]:px-6',
          'max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:max-h-[90dvh] max-sm:rounded-t-3xl max-sm:rounded-b-none',
          'data-[state=open]:[animation:angkop-dialog-in_240ms_cubic-bezier(0.16,1,0.3,1)]',
          'data-[state=closed]:[animation:angkop-dialog-out_150ms_ease-in]',
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('truncate text-lg font-bold text-accent-foreground', className)}
      {...props}
    />
  )
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-sm font-medium text-muted-foreground', className)} {...props} />
}

// Tinted bar with the title and description on the left and the close button on the right.
// `actions` sit beside the close button (an expand toggle, for example).
export function DialogHeader({
  title,
  description,
  actions,
  className
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header
      data-slot="dialog-header"
      className={cn('mb-6 flex items-start justify-between gap-4 bg-accent p-6', className)}
    >
      <div className="flex min-w-0 flex-col">
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {actions}
        <DialogPrimitive.Close
          aria-label="Close"
          className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-background text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <X className="size-5" />
        </DialogPrimitive.Close>
      </div>
    </header>
  )
}

export function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex items-center gap-2 p-6 [&>*]:h-[42px] [&>*]:text-[15px]', className)}
      {...props}
    />
  )
}
