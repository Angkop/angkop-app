import { useController, useFormContext } from 'react-hook-form'
import { ChipList } from '@/components/chip-list'
import type { ProfileFormValues } from '@/lib/profile-form'

type ChipListFieldName =
  | 'preferences.desiredRoles'
  | 'preferences.preferredLocations'
  | 'preferences.preferredIndustries'
  | `projects.${number}.technologies`

export function ChipListField({ name, placeholder }: { name: ChipListFieldName; placeholder: string }) {
  const { control } = useFormContext<ProfileFormValues>()
  const { field } = useController({ control, name })

  return (
    <ChipList
      items={field.value}
      onAdd={(value) => field.onChange([...field.value, value])}
      onRemove={(value) => field.onChange(field.value.filter((item) => item !== value))}
      placeholder={placeholder}
    />
  )
}
