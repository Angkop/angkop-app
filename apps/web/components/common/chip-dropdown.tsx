'use client'

import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const TRIGGER_VARIANT_CLASS_NAMES = {
  default: 'bg-muted text-foreground hover:bg-muted/70',
  info: 'bg-primary/10 text-primary hover:bg-primary/20',
  success: 'bg-match-strong/15 text-match-strong hover:bg-match-strong/25',
  warning: 'bg-match-partial/25 text-match-partial-foreground hover:bg-match-partial/35',
  attention: 'bg-destructive/10 text-destructive hover:bg-destructive/20'
} as const

export type ChipDropdownVariant = keyof typeof TRIGGER_VARIANT_CLASS_NAMES

// A pill that opens a short menu of actions, for a value the user can change in place (an
// application's status, for example). The pill is tinted by `variant`; pass `trigger` to open
// the menu from your own content instead, and `readOnly` to show the pill without the arrow or
// the menu. Compose the menu from ChipDropdown.Header, .ActionsGroup and .Action.
export function ChipDropdown({
  label,
  variant = 'default',
  trigger,
  readOnly = false,
  disabled = false,
  className,
  children
}: {
  label?: string
  variant?: ChipDropdownVariant
  trigger?: ReactNode
  readOnly?: boolean
  disabled?: boolean
  className?: string
  children: ReactNode
}) {
  if (readOnly) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-2xl px-3 py-1 text-sm font-semibold',
          TRIGGER_VARIANT_CLASS_NAMES[variant],
          className
        )}
      >
        {label}
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'inline-flex cursor-pointer items-center gap-1 text-sm font-semibold outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
            trigger ? 'text-foreground' : cn('rounded-2xl px-3 py-1', TRIGGER_VARIANT_CLASS_NAMES[variant]),
            className
          )}
        >
          {trigger ?? label}
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44 rounded-lg">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ChipDropdownHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mb-2 flex flex-col px-3 py-2 text-center', className)}>{children}</div>
}

function ChipDropdownActionsGroup({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div role="group" className={className}>
      {children}
    </div>
  )
}

// One row of the menu: an optional icon, then the label. Picking it runs onClick and closes the menu.
function ChipDropdownAction({
  icon,
  onClick,
  disabled,
  className,
  children
}: {
  icon?: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <DropdownMenuItem onSelect={onClick} disabled={disabled} className={cn('py-2', className)}>
      {icon ? <span className="mr-2 flex shrink-0 items-center [&_svg]:size-4">{icon}</span> : null}
      <span className="text-sm">{children}</span>
    </DropdownMenuItem>
  )
}

ChipDropdown.Header = ChipDropdownHeader
ChipDropdown.ActionsGroup = ChipDropdownActionsGroup
ChipDropdown.Action = ChipDropdownAction
