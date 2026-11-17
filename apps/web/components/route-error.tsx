'use client'

import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Shared body for a segment's error.tsx. The app shell stays on screen around it, so the
// user can still navigate away; reset re-renders the segment and refetches its data.
export function RouteError({ title, onReset }: { title: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border p-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">This is usually temporary. Reload to try again.</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onReset}>
        Reload Page
      </Button>
    </div>
  )
}
