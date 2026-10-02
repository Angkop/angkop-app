import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { API_URL } from '@/constants/api'

type ListingDetail = {
  id: string
  platformJobId: string
  title: string
  company: string
  description: string
  requiredSkills: string[]
  sourceName: string
  sourceUrl: string
}

async function getListing(jobId: string): Promise<ListingDetail | null> {
  const response = await fetch(`${API_URL}/api/jobs/${jobId}`, { cache: 'no-store' })
  if (!response.ok) return null
  return response.json()
}

// The class names and data-angkop-* attributes below are a scraper contract shared with
// apps/extension/src/content/content.js's scrapeDemoPlatform() and the static demo page at
// apps/web/public/demo/job-listing.html — keep all three in sync if this markup changes.
export async function ListingDetailPage({ jobId }: { jobId: string }) {
  const listing = await getListing(jobId)
  if (!listing) notFound()

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/listings"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to Listings
      </Link>

      <div
        className="job-listing rounded-lg border border-border bg-card p-6 shadow-sm"
        data-angkop-platform="demo"
        data-angkop-platform-job-id={listing.platformJobId}
      >
        <h1 className="job-title text-2xl font-semibold">{listing.title}</h1>
        <p className="job-company mt-1 text-sm text-muted-foreground">{listing.company}</p>
        <p className="job-description mt-4 text-sm leading-relaxed text-foreground">{listing.description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {listing.requiredSkills.map((skill) => (
            <Badge key={skill} className="job-skill">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Originally listed on{' '}
        <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
          {listing.sourceName}
        </a>
        . Re-served here for the Angkop extension demo — apply through the original posting.
      </p>
    </div>
  )
}
