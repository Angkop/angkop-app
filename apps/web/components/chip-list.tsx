'use client'

import { useState } from 'react'
import { Check, Loader2, Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ChipList({
  items,
  onAdd,
  onRemove,
  placeholder,
  // Defaults to "nothing in flight" so callers backed by synchronous local state (the
  // profile-fields editors) can skip this entirely. The "add" control doesn't need an
  // equivalent prop — commit() below already unmounts it synchronously on click, before
  // a second click could ever land, so there's no window to protect there.
  removingItem = null
}: {
  items: string[]
  onAdd: (value: string) => void
  onRemove: (value: string) => void
  placeholder: string
  removingItem?: string | null
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  function commit() {
    const value = draft.trim()
    if (value && !items.includes(value)) onAdd(value)
    setDraft('')
    setAdding(false)
  }

  function cancel() {
    setDraft('')
    setAdding(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const isRemoving = removingItem === item
        return (
          <Badge key={item} variant="secondary">
            {item}
            <button
              type="button"
              aria-label={isRemoving ? `Removing ${item}` : `Remove ${item}`}
              disabled={isRemoving}
              onClick={() => onRemove(item)}
              className="cursor-pointer rounded-full p-0.5 hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRemoving ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3" />}
            </button>
          </Badge>
        )
      })}
      {adding ? (
        <div className="inline-flex items-center gap-1">
          <Input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commit()
              if (event.key === 'Escape') cancel()
            }}
            placeholder={placeholder}
            className="h-7 w-32 text-xs"
          />
          <Button
            type="button"
            variant="default"
            size="icon-sm"
            aria-label="Confirm tag"
            className="size-7"
            onClick={commit}
          >
            <Check className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Cancel adding tag"
            className="size-7"
            onClick={cancel}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
        >
          <Plus className="size-3" />
          Add
        </button>
      )}
    </div>
  )
}
