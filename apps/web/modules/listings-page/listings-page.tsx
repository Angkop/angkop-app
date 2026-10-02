import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { API_URL } from '@/constants/api'

type ListingSummary = {
  id: string
  title: string
  company: string
  requiredSkills: string[]
  sourceName: string
}

async function getListings(): Promise<ListingSummary[]> {
  const response = await fetch(`${API_URL}/api/jobs`, { cache: 'no-store' })
  if (!response.ok) return []
  return response.json()
}

export async function ListingsPage() {
  const listings = await getListings()

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <PageHeader
        title="Angkop Listings"
        description="Real postings pulled from public job APIs, re-served here for the browser extension to read."
      />

      {listings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No real listings ingested yet. Run{' '}
          <code className="rounded bg-muted px-1 py-0.5">pnpm --filter @angkop/server run ingest:jobs</code> to pull
          some in.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <Link
              key={listing.id}
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
          ))}
        </div>
      )}
    </div>
  )
}
