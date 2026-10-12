'use client'

import { AlertTriangle } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogIconBadge,
  DialogTitle
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <DialogIconBadge icon={AlertTriangle} variant={confirmVariant === 'destructive' ? 'destructive' : 'primary'} />
            <div className="min-w-0 flex-1 space-y-1 pt-0.5">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
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
