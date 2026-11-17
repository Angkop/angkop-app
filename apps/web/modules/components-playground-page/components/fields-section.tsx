'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { FIELD_TYPE } from '@/components/common/form/constants/field-type'
import { DateInput } from '@/components/common/form/date-input'
import { Form } from '@/components/common/form/form'
import { RadioInput } from '@/components/common/form/radio-input'
import { SearchInput } from '@/components/common/form/search-input'
import { SelectInput } from '@/components/common/form/select-input'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { SAMPLE_ROLE_OPTIONS } from '../constants/sample-data'
import { PlaygroundSection, Variant } from './playground-section'

type PlaygroundFormValues = {
  name: string
  company: string
  bio: string
  role: string
  workSetup: string
  relocate: boolean
  notifications: boolean
  startDate: string
  startMonth: string
  interviewAt: string
  query: string
  salary: string
}

const DEFAULT_VALUES: PlaygroundFormValues = {
  name: '',
  company: '',
  bio: '',
  role: '',
  workSetup: 'remote',
  relocate: false,
  notifications: true,
  startDate: '',
  startMonth: '',
  interviewAt: '',
  query: '',
  salary: ''
}

const WORK_SETUP_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' }
]

const PlaygroundField = Form.Field<PlaygroundFormValues>

export function FieldsSection() {
  const form = useForm<PlaygroundFormValues>({ defaultValues: DEFAULT_VALUES })
  const [searchValue, setSearchValue] = useState('')

  return (
    <PlaygroundSection
      id='fields'
      title='Fields and Inputs'
      description='Every field is a Form.Field with a fieldType, or a standalone control inside FormField. Hover and focus are live: point at a control or press Tab to see them.'
    >
      <Form
        form={form}
        onSubmit={(values) => {
          toast.success('Sample form submitted', { description: `Name: ${values.name || 'empty'}` })
        }}
        className='contents space-y-0'
      >
        <Variant label='Text input, default' usage={'<Form.Field fieldType="textInput" />'}>
          <PlaygroundField fieldType={FIELD_TYPE.TEXT_INPUT} name='name' label='Full name' placeholder='Maria Santos' />
        </Variant>
        <Variant label='Text input, required with help text' usage={'required help="..."'}>
          <PlaygroundField
            fieldType={FIELD_TYPE.TEXT_INPUT}
            name='company'
            label='Company'
            required
            help='The name as it appears on your resume.'
            placeholder='Sample Company'
          />
        </Variant>
        <Variant label='Amount with thousands separators' usage={'<Form.Field fieldType="amount" />'}>
          <PlaygroundField fieldType={FIELD_TYPE.AMOUNT} name='salary' label='Expected salary (₱)' placeholder='25,000' />
        </Variant>
        <Variant label='Multiline text' usage={'<Form.Field fieldType="multilineTextInput" rows={3} />'}>
          <PlaygroundField
            fieldType={FIELD_TYPE.MULTILINE_TEXT_INPUT}
            name='bio'
            label='About you'
            rows={3}
            placeholder='A few lines about your background'
          />
        </Variant>
        <Variant label='Select' usage={'<Form.Field fieldType="select" options={...} />'}>
          <PlaygroundField
            fieldType={FIELD_TYPE.SELECT}
            name='role'
            label='Desired role'
            placeholder='Pick a role'
            options={SAMPLE_ROLE_OPTIONS}
          />
        </Variant>
        <Variant label='Radio group' usage={'<Form.Field fieldType="radio" options={...} />'}>
          <PlaygroundField
            fieldType={FIELD_TYPE.RADIO}
            name='workSetup'
            label='Work setup'
            options={WORK_SETUP_OPTIONS}
          />
        </Variant>
        <Variant label='Checkbox and switch' usage={'fieldType="checkbox" | "switch"'}>
          <div className='space-y-3'>
            <PlaygroundField fieldType={FIELD_TYPE.CHECKBOX} name='relocate' label='Open to relocating' />
            <PlaygroundField fieldType={FIELD_TYPE.SWITCH} name='notifications' label='Email me new matches' />
          </div>
        </Variant>
        <Variant label='Date, month and date-time' usage={'fieldType="date" | "month" | "dateTime"'} wide>
          <div className='grid gap-3 sm:grid-cols-3'>
            <PlaygroundField fieldType={FIELD_TYPE.DATE} name='startDate' label='Available from' />
            <PlaygroundField fieldType={FIELD_TYPE.MONTH} name='startMonth' label='Graduation month' />
            <PlaygroundField fieldType={FIELD_TYPE.DATE_TIME} name='interviewAt' label='Interview slot' />
          </div>
        </Variant>
        <Variant label='Search, in a form' usage={'<Form.Field fieldType="search" />'}>
          <PlaygroundField
            fieldType={FIELD_TYPE.SEARCH}
            name='query'
            label='Search jobs'
            placeholder='Title or company'
          />
        </Variant>
        <Variant label='Form submit' usage={'<Form form={form} onSubmit={...}>'}>
          <Button type='submit' variant='outline' size='sm'>
            Submit Sample Form
          </Button>
        </Variant>
      </Form>

      <Variant label='Search input, standalone' usage={'<SearchInput value onValueChange />'}>
        <SearchInput
          value={searchValue}
          onValueChange={setSearchValue}
          placeholder='Search by title or company'
          aria-label='Search by title or company'
        />
      </Variant>
      <Variant label='Search input, disabled' usage='disabled'>
        <SearchInput
          value=''
          onValueChange={() => undefined}
          placeholder='Search is unavailable'
          aria-label='Search'
          disabled
        />
      </Variant>

      <Variant label='Error state: text' usage={'<FormField error="Add a company name" />'}>
        <FormField id='demo-error-text' label='Company' error='Add a company name'>
          {(controlProps) => <Input {...controlProps} defaultValue='' placeholder='Sample Company' />}
        </FormField>
      </Variant>
      <Variant label='Error state: select' usage={'aria-invalid on SelectInput'}>
        <FormField id='demo-error-select' label='Desired role' error='Pick a role to see matches'>
          {(controlProps) => (
            <SelectInput
              {...controlProps}
              className='w-full'
              value=''
              onValueChange={() => undefined}
              options={SAMPLE_ROLE_OPTIONS}
              placeholder='Pick a role'
            />
          )}
        </FormField>
      </Variant>
      <Variant label='Error state: checkbox' usage={'<FormField inlineLabel error />'}>
        <FormField id='demo-error-check' label='I agree to share my profile' inlineLabel error='Agree to continue'>
          {(controlProps) => <Checkbox {...controlProps} />}
        </FormField>
      </Variant>
      <Variant label='Error state: date' usage={'aria-invalid on DateInput'}>
        <FormField id='demo-error-date' label='Available from' error='Pick a date after today'>
          {(controlProps) => <DateInput {...controlProps} defaultValue='' />}
        </FormField>
      </Variant>

      <Variant label='Disabled' usage='disabled'>
        <div className='space-y-3'>
          <Input disabled placeholder='Text input' aria-label='Disabled text input' />
          <SelectInput
            className='w-full'
            value=''
            onValueChange={() => undefined}
            options={SAMPLE_ROLE_OPTIONS}
            placeholder='Select'
            disabled
          />
          <div className='flex items-center gap-4'>
            <Checkbox disabled aria-label='Disabled checkbox' />
            <Checkbox disabled checked aria-label='Disabled checked checkbox' />
            <Switch disabled aria-label='Disabled switch' />
          </div>
          <RadioInput
            id='demo-disabled-radio'
            value='a'
            onValueChange={() => undefined}
            options={WORK_SETUP_OPTIONS}
            orientation='horizontal'
            disabled
          />
        </div>
      </Variant>
      <Variant label='Read-only versus disabled' usage='readOnly'>
        <Input readOnly value='Read-only: this view does not edit' aria-label='Read-only input' />
      </Variant>
    </PlaygroundSection>
  )
}
