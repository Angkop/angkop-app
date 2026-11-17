'use client'

import type { CSSProperties } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

// Modeled on Oboda's alert: a flat bar tinted with the palest shade of the state color, no
// border, a small radius and a soft shadow. Backgrounds are opaque (the tint is mixed into the
// page background instead of laid over it) so toasts that stack do not show through each other. The icon and title take the state color, and the
// message underneath stays in the text color so it reads at any tint. The classes replace
// sonner's own styles (unstyled), so every toast.success / toast.error call keeps working and
// picks this up.
const TOAST_CLASS_NAMES = {
  toast: 'flex w-full items-start gap-3 rounded px-4 py-2.5 text-sm shadow-md',
  icon: 'mt-px flex shrink-0 items-center',
  content: 'flex min-w-0 flex-1 flex-col',
  title: 'font-semibold',
  description: 'whitespace-pre-line text-foreground/80',
  actionButton:
    'order-last shrink-0 cursor-pointer rounded px-2 py-1 font-semibold outline-none hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-primary',
  closeButton:
    'order-last flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-70 outline-none hover:bg-black/5 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-primary',
  default: 'bg-popover text-popover-foreground ring-1 ring-border',
  success: 'bg-accent text-primary',
  error: 'bg-[color-mix(in_oklab,var(--destructive)_10%,var(--background))] text-destructive',
  warning: 'bg-[color-mix(in_oklab,var(--match-partial)_20%,var(--background))] text-match-partial-foreground',
  info: 'bg-secondary text-secondary-foreground',
  loading: 'bg-popover text-popover-foreground ring-1 ring-border'
}

const TOAST_ICONS = {
  success: <CheckCircle2 className="size-5" />,
  error: <AlertCircle className="size-5" />,
  warning: <AlertTriangle className="size-5" />,
  info: <Info className="size-5" />,
  loading: <Loader2 className="size-5 animate-spin" />
}

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="top-right"
      offset={20}
      closeButton
      icons={TOAST_ICONS}
      toastOptions={{ unstyled: true, classNames: TOAST_CLASS_NAMES }}
      className="toaster group"
      style={{ '--width': '420px' } as CSSProperties}
      {...props}
    />
  )
}
