import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

const INPUT_TYPE_BY_MODE = {
  date: 'date',
  month: 'month',
  dateTime: 'datetime-local'
} as const

// The browser's own date control, so phones get their native picker. Values are the HTML
// formats: YYYY-MM-DD, YYYY-MM or YYYY-MM-DDTHH:mm.
export function DateInput({
  mode = 'date',
  ...inputProps
}: { mode?: keyof typeof INPUT_TYPE_BY_MODE } & Omit<ComponentProps<typeof Input>, 'type'>) {
  return <Input {...inputProps} type={INPUT_TYPE_BY_MODE[mode]} />
}
