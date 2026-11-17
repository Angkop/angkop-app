import { Children, Fragment, isValidElement, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function RemoveEntryButton({ label, onRemove }: { label?: string; onRemove: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onRemove}>
          <X className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

// The divider between two entries: one full-width rule broken into three lines, so it reads
// differently from the solid rule under each entry's header.
function EntryDivider() {
  return (
    <div role="separator" className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="h-px flex-1 bg-border" />
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

// Repeated entries (a school, a job, a language) sit one under another, split by a divider
// instead of each being boxed in its own card.
export function EntryList({ children }: { children: ReactNode }) {
  return (
    <div>
      {Children.toArray(children).map((child, index) => (
        // toArray gives every child a stable key from its own `key` (the field id), so removing
        // a middle entry doesn't remount the ones after it.
        <Fragment key={isValidElement(child) && child.key !== null ? child.key : index}>
          {index > 0 ? <EntryDivider /> : null}
          {child}
        </Fragment>
      ))}
    </div>
  )
}

// A titled group of fields, with a divider under the header. Pass onRemove to show the remove
// button in the header.
export function Entry({
  title,
  removeLabel,
  onRemove,
  children
}: {
  title: string
  removeLabel?: string
  onRemove?: () => void
  children: ReactNode
}) {
  return (
    <div className="space-y-4 py-6 first:pt-0">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {onRemove ? <RemoveEntryButton label={removeLabel} onRemove={onRemove} /> : null}
      </div>
      {children}
    </div>
  )
}
