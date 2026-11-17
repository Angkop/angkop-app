'use client'

import type { ReactNode } from 'react'
import { FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Field } from './field'

function Root<T extends FieldValues>({
  form,
  onSubmit,
  className,
  children
}: {
  form: UseFormReturn<T>
  onSubmit: (values: T) => void | Promise<void>
  className?: string
  children: ReactNode
}) {
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
        {children}
      </form>
    </FormProvider>
  )
}

// <Form form={form} onSubmit={...}><Form.Field<Values> fieldType="select" name="..." label="..." /></Form>
export const Form = Object.assign(Root, { Root, Field })
