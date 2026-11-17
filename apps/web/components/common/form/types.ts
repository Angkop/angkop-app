import type { FieldValues, Path } from 'react-hook-form'
import type { FieldType } from './constants/field-type'

export type FieldOption = {
  label: string
  value: string
  // A second, muted line under the label in the open list.
  description?: string
  disabled?: boolean
}

// What a field hands back on change: text for inputs, selects, radios and dates, a boolean
// for a checkbox or switch.
export type FieldValue = string | boolean

export type FormFieldProps<T extends FieldValues> = {
  fieldType: FieldType
  name: Path<T>
  label: string
  // Keeps the label for screen readers only, for rows that show just a placeholder.
  hideLabel?: boolean
  // Label above the control (default) or in a column beside it from `sm` up.
  orientation?: 'vertical' | 'horizontal'
  // `sm` is a 36px control (the height of a button) for dense forms like the profile editor.
  size?: 'default' | 'sm'
  labelClassName?: string
  help?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  options?: FieldOption[]
  rows?: number
  inputType?: 'text' | 'email' | 'url' | 'tel' | 'number' | 'password'
  className?: string
  // Runs after the form value changes, for dependent fields (clear the end date when
  // "Current" is checked, and so on).
  onValueChange?: (value: FieldValue) => void
}
