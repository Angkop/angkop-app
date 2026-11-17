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
// readers on rows that show only a placeholder. inlineLabel puts the label after the control
// instead of above it, which is how a checkbox or switch reads. orientation="horizontal" puts the
// label in a column beside the control from `sm` up (it still stacks on phones), and the help or
// error text lines up under the control.
export function FormField({
  id,
  label,
  hideLabel = false,
  inlineLabel = false,
  orientation = 'vertical',
  required = false,
  help,
  error,
  className,
  children
}: {
  id: string
  label: string
  hideLabel?: boolean
  inlineLabel?: boolean
  orientation?: 'vertical' | 'horizontal'
  required?: boolean
  help?: string
  error?: string
  className?: string
  children: (controlProps: FormControlProps) => ReactNode
}) {
  const isHorizontal = orientation === 'horizontal' && !inlineLabel
  const messageId = error ? `${id}-error` : help ? `${id}-help` : undefined
  const control = children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': messageId })
  const labelNode = (
    <Label
      htmlFor={id}
      className={cn(
        'font-normal',
        inlineLabel ? 'text-foreground' : 'text-muted-foreground',
        isHorizontal && 'sm:min-h-[41px] sm:leading-snug',
        hideLabel && 'sr-only'
      )}
    >
      {label}
      {required ? (
        <span aria-hidden="true" className="text-destructive">
          *
        </span>
      ) : null}
    </Label>
  )

  return (
    <div
      className={cn(
        isHorizontal ? 'grid gap-y-1.5 sm:grid-cols-[10rem_1fr] sm:gap-x-4' : 'space-y-1.5',
        className
      )}
    >
      {inlineLabel ? (
        <div className="flex items-center gap-2">
          {control}
          {labelNode}
        </div>
      ) : (
        <>
          {labelNode}
          {control}
        </>
      )}
      {error ? (
        <p id={messageId} className={cn('text-xs text-destructive', isHorizontal && 'sm:col-start-2')}>
          {error}
        </p>
      ) : help ? (
        <p id={messageId} className={cn('text-xs text-muted-foreground', isHorizontal && 'sm:col-start-2')}>
          {help}
        </p>
      ) : null}
    </div>
  )
}
