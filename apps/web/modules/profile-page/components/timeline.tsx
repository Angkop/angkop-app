export function Timeline({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex flex-col">{children}</div>
}

export function TimelineItem({
  icon: Icon,
  title,
  subtitle,
  period,
  description,
  isLast
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  period: string
  description?: string | null
  isLast: boolean
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
        {isLast ? null : <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="min-w-0 pb-5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <p className="text-xs text-muted-foreground">{period}</p>
        {description ? <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">{description}</p> : null}
      </div>
    </div>
  )
}
