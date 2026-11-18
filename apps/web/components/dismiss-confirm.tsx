import { Button } from '@/components/ui/button'

// Dismissing can't be undone from the UI, so it confirms first — in place, not in a dialog.
// The caller swaps its Dismiss button for this and owns whether it is showing.
export function DismissConfirm({
  title,
  company,
  isDismissing,
  onConfirm,
  onCancel
}: {
  title: string
  company: string
  isDismissing: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div role="group" aria-label="Confirm dismiss" className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
      <p className="text-xs leading-relaxed text-foreground">
        Dismiss <span className="font-medium">{title}</span> at {company}? It won&apos;t show up in your matches
        again.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="destructive" size="sm" disabled={isDismissing} onClick={onConfirm}>
          {isDismissing ? 'Dismissing…' : 'Dismiss Job'}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={isDismissing} onClick={onCancel}>
          Keep Job
        </Button>
      </div>
    </div>
  )
}
