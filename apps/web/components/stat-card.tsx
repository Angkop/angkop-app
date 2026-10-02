import type { LucideIcon } from 'lucide-react'

type StatCardProps = {
  label: string
  value: string | number
  caption?: string
  icon?: LucideIcon
}

export function StatCard({ label, value, caption, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} /> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
      {caption ? <p className="mt-1 text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  )
}
