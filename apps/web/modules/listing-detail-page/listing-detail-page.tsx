import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ListingCard } from './components/listing-card'
import { getListing } from './queries'

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

      <ListingCard listing={listing} />
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
