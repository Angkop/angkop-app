'use client'

import { Button, type ButtonProps } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader
} from '@/components/ui/dialog'

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmingLabel,
  cancelLabel = 'Cancel',
  confirmVariant = 'destructive',
  isConfirming = false,
  onConfirm
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  // Shown on the confirm button while isConfirming is true — defaults to confirmLabel + "…"
  confirmingLabel?: string
  cancelLabel?: string
  confirmVariant?: ButtonProps['variant']
  // When the caller's onConfirm kicks off a mutation, pass its `loading` flag here so the
  // button can't be double-clicked into firing the same request twice.
  isConfirming?: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !isConfirming && onOpenChange(next)}>
      <DialogContent size="xs">
        <DialogHeader title={title} description={description} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? (confirmingLabel ?? `${confirmLabel}…`) : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
