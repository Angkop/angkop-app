import { PageHeader } from '@/components/page-header'
import { ListingsSkeleton } from '@/modules/listings-page/components/listings-skeleton'

export default function Loading() {
  return (
    <div>
      <PageHeader
        title="Angkop Listings"
        description="Real postings pulled from public job APIs, re-served here for the browser extension to read."
      />
      <ListingsSkeleton />
    </div>
  )
}
