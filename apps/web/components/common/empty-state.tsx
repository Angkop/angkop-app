import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Says why an area is empty and what to do about it, so the description is required.
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className
}: {
  icon?: LucideIcon
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center',
        className
      )}
    >
      <span className='flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground'>
        <Icon className='size-5' />
      </span>
      <div className='space-y-1'>
        <p className='text-sm font-medium text-foreground'>{title}</p>
        <p className='max-w-sm text-xs text-muted-foreground'>{description}</p>
      </div>
      {action}
    </div>
  )
}
