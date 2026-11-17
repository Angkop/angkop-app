'use client'

import { useId } from 'react'
import { useController, useFormContext, type FieldValues } from 'react-hook-form'
import { FormField, type FormControlProps } from '@/components/form-field'
import { Checkbox } from '@/components/ui/checkbox'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { FIELD_TYPE } from './constants/field-type'
import { AmountInput } from './amount-input'
import { DateInput } from './date-input'
import { RadioInput } from './radio-input'
import { SearchInput } from './search-input'
import { SelectInput } from './select-input'
import type { FieldValue, FormFieldProps } from './types'

const INLINE_LABEL_TYPES: string[] = [FIELD_TYPE.CHECKBOX, FIELD_TYPE.SWITCH]
const TEXTAREA_DEFAULT_ROWS = 4
const SMALL_CONTROL_CLASS_NAME = 'h-9 px-3 py-2'
const SMALL_TEXTAREA_CLASS_NAME = 'min-h-0 px-3 py-2'

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

// One entry point for every shared field: pick a fieldType and the form's value, error and
// aria wiring come from react-hook-form's context. Must sit inside a FormProvider (Form.Root
// is one, and so is any form that already wraps its fields in FormProvider).
export function Field<T extends FieldValues>({
  fieldType,
  name,
  label,
  hideLabel,
  orientation,
  size = 'default',
  labelClassName,
  help,
  placeholder,
  disabled,
  required,
  options = [],
  rows = TEXTAREA_DEFAULT_ROWS,
  inputType = 'text',
  className,
  onValueChange
}: FormFieldProps<T>) {
  const id = useId()
  const { control } = useFormContext<T>()
  const { field, fieldState } = useController({ control, name })
  const isSmall = size === 'sm'

  function handleChange(next: FieldValue) {
    field.onChange(next)
    onValueChange?.(next)
  }

  function renderControl(controlProps: FormControlProps) {
    switch (fieldType) {
      case FIELD_TYPE.TEXT_INPUT:
        return (
          <Input
            {...controlProps}
            ref={field.ref}
            name={field.name}
            type={inputType}
            value={asString(field.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={isSmall ? SMALL_CONTROL_CLASS_NAME : undefined}
            onBlur={field.onBlur}
            onChange={(event) => handleChange(event.target.value)}
          />
        )
      case FIELD_TYPE.MULTILINE_TEXT_INPUT:
        return (
          <Textarea
            {...controlProps}
            ref={field.ref}
            name={field.name}
            rows={rows}
            value={asString(field.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={isSmall ? SMALL_TEXTAREA_CLASS_NAME : undefined}
            onBlur={field.onBlur}
            onChange={(event) => handleChange(event.target.value)}
          />
        )
      case FIELD_TYPE.AMOUNT:
        return (
          <AmountInput
            {...controlProps}
            ref={field.ref}
            name={field.name}
            value={asString(field.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={isSmall ? SMALL_CONTROL_CLASS_NAME : undefined}
            onBlur={field.onBlur}
            onValueChange={handleChange}
          />
        )
      case FIELD_TYPE.SEARCH:
        return (
          <SearchInput
            {...controlProps}
            ref={field.ref}
            name={field.name}
            value={asString(field.value)}
            placeholder={placeholder}
            disabled={disabled}
            onBlur={field.onBlur}
            onValueChange={handleChange}
          />
        )
      case FIELD_TYPE.SELECT:
        return (
          <SelectInput
            {...controlProps}
            ref={field.ref}
            className={cn('w-full', isSmall && SMALL_CONTROL_CLASS_NAME)}
            value={asString(field.value)}
            options={options}
            placeholder={placeholder}
            disabled={disabled}
            onValueChange={handleChange}
          />
        )
      case FIELD_TYPE.CHECKBOX:
        return (
          <Checkbox
            {...controlProps}
            ref={field.ref}
            name={field.name}
            checked={field.value === true}
            disabled={disabled}
            onBlur={field.onBlur}
            onCheckedChange={(checked) => handleChange(checked === true)}
          />
        )
      case FIELD_TYPE.SWITCH:
        return (
          <Switch
            {...controlProps}
            ref={field.ref}
            name={field.name}
            checked={field.value === true}
            disabled={disabled}
            onBlur={field.onBlur}
            onCheckedChange={handleChange}
          />
        )
      case FIELD_TYPE.RADIO:
        return (
          <RadioInput
            {...controlProps}
            ref={field.ref}
            aria-label={label}
            value={asString(field.value)}
            options={options}
            disabled={disabled}
            onValueChange={handleChange}
          />
        )
      case FIELD_TYPE.DATE:
      case FIELD_TYPE.MONTH:
      case FIELD_TYPE.DATE_TIME:
        return (
          <DateInput
            {...controlProps}
            ref={field.ref}
            name={field.name}
            mode={fieldType}
            value={asString(field.value)}
            disabled={disabled}
            className={isSmall ? SMALL_CONTROL_CLASS_NAME : undefined}
            onBlur={field.onBlur}
            onChange={(event) => handleChange(event.target.value)}
          />
        )
    }
  }

  return (
    <FormField
      id={id}
      label={label}
      hideLabel={hideLabel}
      orientation={orientation}
      size={size}
      labelClassName={labelClassName}
      inlineLabel={INLINE_LABEL_TYPES.includes(fieldType)}
      required={required}
      help={help}
      error={fieldState.error?.message}
      className={className}
    >
      {renderControl}
    </FormField>
  )
}
