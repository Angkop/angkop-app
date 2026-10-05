import { PageHeader } from '@/components/page-header'
import { ListingRow } from './components/listing-row'
import { getListings } from './queries'

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
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
