export const FIELD_TYPE = {
  TEXT_INPUT: 'textInput',
  MULTILINE_TEXT_INPUT: 'multilineTextInput',
  SEARCH: 'search',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  SWITCH: 'switch',
  RADIO: 'radio',
  DATE: 'date',
  MONTH: 'month',
  DATE_TIME: 'dateTime'
} as const

export type FieldType = (typeof FIELD_TYPE)[keyof typeof FIELD_TYPE]
