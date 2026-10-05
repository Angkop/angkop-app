import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { ListingSummary } from '../types'

export function ListingRow({ listing }: { listing: ListingSummary }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="flex flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:border-foreground/20"
    >
      <div>
        <p className="text-sm font-medium text-foreground">{listing.title}</p>
        <p className="text-xs text-muted-foreground">
          {listing.company} · via {listing.sourceName}
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {listing.requiredSkills.map((skill) => (
          <Badge key={skill} variant="outline">
            {skill}
          </Badge>
        ))}
      </div>
    </Link>
  )
}
