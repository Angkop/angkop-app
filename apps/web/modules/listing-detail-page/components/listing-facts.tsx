import { Banknote, Briefcase, Globe, MapPin } from 'lucide-react'
import { EMPLOYMENT_TYPE_LABELS, WORK_SETUP_LABELS } from '@angkop/shared'
import { formatSalaryRange } from '../utils'
import type { ListingDetail } from '../types'

export function ListingFacts({ listing }: { listing: ListingDetail }) {
  const facts = [
    { icon: MapPin, label: 'Location', value: listing.location },
    { icon: Globe, label: 'Work Setup', value: listing.workSetup ? WORK_SETUP_LABELS[listing.workSetup] : null },
    {
      icon: Briefcase,
      label: 'Employment Type',
      value: listing.employmentType ? EMPLOYMENT_TYPE_LABELS[listing.employmentType] : null
    },
    { icon: Banknote, label: 'Salary', value: formatSalaryRange(listing.salaryMin, listing.salaryMax) }
  ]

  return (
    <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 rounded-md border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
      {facts.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">{label}:</span>
          <span className={value ? 'font-medium text-foreground' : 'text-muted-foreground italic'}>
            {value ?? 'Not specified'}
          </span>
        </div>
      ))}
    </div>
  )
}
