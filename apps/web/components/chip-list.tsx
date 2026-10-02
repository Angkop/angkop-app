'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export function ChipList({
  items,
  onAdd,
  onRemove,
  placeholder
}: {
  items: string[]
  onAdd: (value: string) => void
  onRemove: (value: string) => void
  placeholder: string
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  function commit() {
    const value = draft.trim()
    if (value && !items.includes(value)) onAdd(value)
    setDraft('')
    setAdding(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <Badge key={item} variant="secondary">
          {item}
          <button
            type="button"
            aria-label={`Remove ${item}`}
            onClick={() => onRemove(item)}
            className="cursor-pointer rounded-full p-0.5 hover:bg-foreground/10"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {adding ? (
        <Input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit()
            if (event.key === 'Escape') {
              setDraft('')
              setAdding(false)
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          className="h-7 w-32 text-xs"
        />
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
