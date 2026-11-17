import { Plus } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { FIELD_TYPE } from '@/components/common/form/constants/field-type'
import { Button } from '@/components/ui/button'
import { EMPTY_CERTIFICATION, type ProfileFormValues } from '@/lib/profile-form'
import { Entry, EntryList } from './entry'
import { ProfileField } from './profile-field'

export function CertificationsFields() {
  const { control } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'certifications' })

  return (
    <div className="space-y-4">
      <EntryList>
        {fields.map((field, index) => (
          <Entry
            key={field.id}
            title={`Certification ${index + 1}`}
            removeLabel="Remove certification"
            onRemove={() => remove(index)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ProfileField
                fieldType={FIELD_TYPE.TEXT_INPUT}
                name={`certifications.${index}.name`}
                label="Certification name"
                placeholder="e.g. AWS Cloud Practitioner"
              />
              <ProfileField
                fieldType={FIELD_TYPE.TEXT_INPUT}
                name={`certifications.${index}.issuer`}
                label="Issuer"
                placeholder="e.g. Amazon Web Services"
              />
              <ProfileField
                fieldType={FIELD_TYPE.MONTH}
                name={`certifications.${index}.issueDate`}
                label="Issue date"
              />
              <ProfileField
                fieldType={FIELD_TYPE.MONTH}
                name={`certifications.${index}.expirationDate`}
                label="Expiration date"
              />
              <ProfileField
                fieldType={FIELD_TYPE.TEXT_INPUT}
                name={`certifications.${index}.credentialId`}
                label="Credential ID"
              />
              <ProfileField
                fieldType={FIELD_TYPE.TEXT_INPUT}
                name={`certifications.${index}.credentialUrl`}
                label="Credential URL"
                placeholder="https://"
              />
            </div>
          </Entry>
        ))}
      </EntryList>
      <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_CERTIFICATION)}>
        <Plus className="size-3.5" />
        Add certification
      </Button>
    </div>
  )
}
