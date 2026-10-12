type StatStripItem = {
  label: string
  value: string | number
  caption?: string
}

// A single divided row of label/value pairs, replacing a grid of separate boxed
// stat cards — one border around the whole group instead of one around every number.
export function StatStrip({ items }: { items: StatStripItem[] }) {
  return (
    <div className="grid grid-cols-2 divide-y divide-border rounded-lg border border-border sm:grid-cols-none sm:flex sm:divide-x sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="p-4 sm:flex-1">
          <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
          <p className="mt-1 font-display text-2xl font-medium tracking-tight text-foreground tabular-nums">
            {item.value}
          </p>
          {item.caption ? <p className="mt-0.5 text-xs text-muted-foreground">{item.caption}</p> : null}
        </div>
      ))}
    </div>
  )
}
