import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// Repeated entries (a school, a job, a language) sit one under another, split by a divider
// instead of each being boxed in its own card.
export function EntryList({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-border">{children}</div>
}

// A titled group of fields. Pass onRemove to show the remove button in the header.
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
      <div className="flex min-h-7 items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {onRemove ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={removeLabel} onClick={onRemove}>
                <X className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{removeLabel}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      {children}
    </div>
  )
}
