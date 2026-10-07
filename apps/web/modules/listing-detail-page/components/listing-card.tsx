import { Badge } from '@/components/ui/badge'
import type { ListingDetail } from '../types'

// The class names and data-angkop-* attributes below are a scraper contract shared with
// apps/extension/src/content/content.js's scrapeDemoPlatform() and the static demo page at
// apps/web/public/demo/job-listing.html — keep all three in sync if this markup changes.
export function ListingCard({ listing }: { listing: ListingDetail }) {
  return (
    <div
      className="job-listing rounded-lg border border-border bg-card p-6 shadow-sm"
      data-angkop-platform="demo"
      data-angkop-platform-job-id={listing.platformJobId}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="job-title text-2xl font-semibold">{listing.title}</h1>
          <p className="job-company mt-1 text-sm text-muted-foreground">{listing.company}</p>
        </div>
        <Badge variant="outline" className="shrink-0">
          {listing.sourceName}
        </Badge>
      </div>
      <p className="job-description mt-4 text-sm leading-relaxed text-foreground">{listing.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {listing.requiredSkills.map((skill) => (
          <Badge key={skill} className="job-skill">
            {skill}
          </Badge>
        ))}
      </div>
    </div>
  )
}
