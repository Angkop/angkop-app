'use client'

import type { CSSProperties } from 'react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      richColors
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          // Mirrors Button's own variant colors (bg-primary/bg-destructive) so toasts use
          // the same palette instead of sonner's built-in defaults.
          '--success-bg': 'var(--primary)',
          '--success-text': 'var(--primary-foreground)',
          '--success-border': 'var(--primary)',
          '--error-bg': 'var(--destructive)',
          '--error-text': 'white',
          '--error-border': 'var(--destructive)'
        } as CSSProperties
      }
      {...props}
    />
  )
}
