import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Re-served here for the Angkop extension demo — apply through the original posting.
        </p>
        <a
          href={listing.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: 'sm' }), 'shrink-0')}
        >
          Apply on {listing.sourceName}
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  )
}
