import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <h1 className="text-xl font-semibold">Angkop Listings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Real postings pulled from public job APIs, re-served here for the browser extension to read.
      </p>

      {listings.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No real listings ingested yet. Run{' '}
          <code className="rounded bg-muted px-1 py-0.5">
            pnpm --filter @angkop/server run ingest:jobs
          </code>{' '}
          to pull some in.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.id}`}>
              <Card className="transition-colors hover:border-primary">
                <CardHeader>
                  <CardTitle>{listing.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {listing.company} · via {listing.sourceName}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-1.5">
                  {listing.requiredSkills.map((skill) => (
                    <Badge key={skill}>{skill}</Badge>
                  ))}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
