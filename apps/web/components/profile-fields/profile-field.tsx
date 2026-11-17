import { Form } from '@/components/common/form/form'
import type { FormFieldProps } from '@/components/common/form/types'
import type { ProfileFormValues } from '@/lib/profile-form'

// Form.Field bound to the profile form, so field names are checked against ProfileFormValues,
// at the small (36px) control size the profile editor uses.
export function ProfileField(props: FormFieldProps<ProfileFormValues>) {
  return <Form.Field<ProfileFormValues> size="sm" {...props} />
}
