'use client'

import { useLayoutEffect, useRef, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

// Keeps digits and a single decimal point, so the value a form stores never has commas in it.
function sanitizeAmount(raw: string): string {
  const [whole, ...fraction] = raw.replace(/[^\d.]/g, '').split('.')
  return fraction.length > 0 ? `${whole}.${fraction.join('')}` : whole
}

function formatAmount(value: string): string {
  const [whole, fraction] = value.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction === undefined ? grouped : `${grouped}.${fraction}`
}

// A number field that shows thousands separators as you type (52,105,215). The value it takes
// and hands back is the plain number as text (52105215), so schemas and API payloads never see
// the commas. It is a text input in numeric mode, because a type="number" input can't show them.
export function AmountInput({
  value,
  onValueChange,
  ref,
  ...inputProps
}: {
  value: string
  onValueChange: (value: string) => void
} & Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type' | 'inputMode'>) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  // How many digits sit left of the caret after an edit. Adding a comma moves the text under
  // the caret, so the caret is put back after the same digit once the new text renders.
  const charsBeforeCaret = useRef<number | null>(null)
  const formatted = formatAmount(value)

  useLayoutEffect(() => {
    const input = inputRef.current
    const target = charsBeforeCaret.current
    if (!input || target === null) return
    charsBeforeCaret.current = null
    let position = 0
    let seen = 0
    while (position < formatted.length && seen < target) {
      if (formatted[position] !== ',') seen += 1
      position += 1
    }
    input.setSelectionRange(position, position)
  })

  return (
    <Input
      {...inputProps}
      ref={(node) => {
        inputRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={formatted}
      onChange={(event) => {
        const { value: raw, selectionStart } = event.target
        charsBeforeCaret.current = raw.slice(0, selectionStart ?? raw.length).replace(/[^\d.]/g, '').length
        onValueChange(sanitizeAmount(raw))
      }}
    />
  )
}
