import type { ReactNode } from 'react'

export function ProfileFieldSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-border p-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  )
}
