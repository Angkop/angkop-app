import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type FormControlProps = {
  id: string
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
}

// Label, control, optional help text and inline error in one place. The control comes in as
// a render function so it can take the id and aria props that tie it to its label and
// message. An error replaces the help text, and hideLabel keeps the label for screen
// readers on rows that show only a placeholder.
export function FormField({
  id,
  label,
  hideLabel = false,
  help,
  error,
  className,
  children
}: {
  id: string
  label: string
  hideLabel?: boolean
  help?: string
  error?: string
  className?: string
  children: (controlProps: FormControlProps) => ReactNode
}) {
  const messageId = error ? `${id}-error` : help ? `${id}-help` : undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className={hideLabel ? 'sr-only' : undefined}>
        {label}
      </Label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': messageId })}
      {error ? (
        <p id={messageId} className="text-xs text-destructive">
          {error}
        </p>
      ) : help ? (
        <p id={messageId} className="text-xs text-muted-foreground">
          {help}
        </p>
      ) : null}
    </div>
  )
}
