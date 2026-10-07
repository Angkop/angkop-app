import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ListingSummary } from '../types'

const MAX_VISIBLE_SKILLS = 6

export function ListingRow({ listing }: { listing: ListingSummary }) {
  const visibleSkills = listing.requiredSkills.slice(0, MAX_VISIBLE_SKILLS)
  const hiddenSkillCount = listing.requiredSkills.length - visibleSkills.length

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{listing.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="size-3 shrink-0" />
            <span className="truncate">{listing.company}</span>
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">
          {listing.sourceName}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visibleSkills.map((skill) => (
          <Badge key={skill}>{skill}</Badge>
        ))}
        {hiddenSkillCount > 0 ? <Badge variant="outline">+{hiddenSkillCount}</Badge> : null}
      </div>
    </Link>
  )
}
