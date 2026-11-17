import { Plus, X } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FormField } from '@/components/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EMPTY_CERTIFICATION, type ProfileFormValues } from '@/lib/profile-form'

export function CertificationsFields() {
  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'certifications' })

  return (
    <div className="space-y-3">
      {fields.map((field, index) => {
        const rowErrors = errors.certifications?.[index]
        const fieldId = (name: string) => `certification-${field.id}-${name}`

        return (
          <div key={field.id} className="space-y-2 rounded-lg border border-border p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <FormField id={fieldId('name')} label="Certification name" hideLabel error={rowErrors?.name?.message}>
                {(controlProps) => (
                  <Input
                    {...controlProps}
                    {...register(`certifications.${index}.name`)}
                    placeholder="Certification name"
                  />
                )}
              </FormField>
              <FormField id={fieldId('issuer')} label="Issuer" hideLabel error={rowErrors?.issuer?.message}>
                {(controlProps) => (
                  <Input
                    {...controlProps}
                    {...register(`certifications.${index}.issuer`)}
                    placeholder="Issuer (e.g. Amazon Web Services)"
                  />
                )}
              </FormField>
            </div>
            <div className="grid items-start gap-2 sm:grid-cols-3">
              <FormField id={fieldId('issue-date')} label="Issue date" hideLabel error={rowErrors?.issueDate?.message}>
                {(controlProps) => (
                  <Input {...controlProps} {...register(`certifications.${index}.issueDate`)} type="month" />
                )}
              </FormField>
              <FormField
                id={fieldId('expiration-date')}
                label="Expiration date (optional)"
                hideLabel
                error={rowErrors?.expirationDate?.message}
              >
                {(controlProps) => (
                  <Input {...controlProps} {...register(`certifications.${index}.expirationDate`)} type="month" />
                )}
              </FormField>
              <div className="flex justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove certification"
                      onClick={() => remove(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove certification</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <FormField
                id={fieldId('credential-id')}
                label="Credential ID"
                hideLabel
                error={rowErrors?.credentialId?.message}
              >
                {(controlProps) => (
                  <Input
                    {...controlProps}
                    {...register(`certifications.${index}.credentialId`)}
                    placeholder="Credential ID (optional)"
                  />
                )}
              </FormField>
              <FormField
                id={fieldId('credential-url')}
                label="Credential URL"
                hideLabel
                error={rowErrors?.credentialUrl?.message}
              >
                {(controlProps) => (
                  <Input
                    {...controlProps}
                    {...register(`certifications.${index}.credentialUrl`)}
                    placeholder="Credential URL (optional)"
                  />
                )}
              </FormField>
            </div>
          </div>
        )
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_CERTIFICATION)}>
        <Plus className="size-3.5" />
        Add certification
      </Button>
    </div>
  )
}
