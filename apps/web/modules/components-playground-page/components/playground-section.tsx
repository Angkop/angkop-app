import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function PlaygroundSection({
  id,
  title,
  description,
  children
}: {
  id: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section id={id} className='scroll-mt-20 space-y-4'>
      <div className='space-y-1'>
        <h2 className='font-display text-lg font-medium tracking-tight text-foreground'>{title}</h2>
        <p className='max-w-2xl text-sm text-muted-foreground'>{description}</p>
      </div>
      <div className='grid gap-4 xl:grid-cols-2'>{children}</div>
    </section>
  )
}

// One component state on display: what it is, the props or usage that produce it, and the
// live component itself.
export function Variant({
  label,
  usage,
  wide = false,
  children
}: {
  label: string
  usage?: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <div className={cn('min-w-0 space-y-3 rounded-lg border border-border bg-card p-4', wide && 'xl:col-span-2')}>
      <div className='space-y-0.5'>
        <p className='text-xs font-medium text-foreground'>{label}</p>
        {usage ? <p className='font-mono text-[11px] break-words text-muted-foreground'>{usage}</p> : null}
      </div>
      <div>{children}</div>
    </div>
  )
}
