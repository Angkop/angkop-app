import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ListingsBrowser } from './components/listings-browser'
import { getListings } from './queries'

export async function ListingsPage() {
  const listings = await getListings()

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to Dashboard
      </Link>

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
        <ListingsBrowser listings={listings} />
      )}
    </div>
  )
}
