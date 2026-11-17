import { PageHeader } from '@/components/page-header'
import { ListingsBrowser } from './components/listings-browser'
import { getListings, getListingSkills, getListingSources } from './queries'

const PAGE_SIZE = 12

export async function ListingsPage({
  searchParams
}: {
  searchParams: { page?: string; q?: string; source?: string; skill?: string }
}) {
  const page = Number(searchParams.page) || 1
  const q = searchParams.q?.trim() || undefined
  const source = searchParams.source?.trim() || undefined
  const skill = searchParams.skill?.trim() || undefined

  const [listings, sources, skills] = await Promise.all([
    getListings({ page, pageSize: PAGE_SIZE, q, source, skill }),
    getListingSources(),
    getListingSkills()
  ])

  return (
    <div>
      <PageHeader
        title="Angkop Listings"
        description="Real postings pulled from public job APIs, re-served here for the browser extension to read."
      />

      {listings.total === 0 && !q && !source && !skill ? (
        <p className="text-sm text-muted-foreground">
          No listings are available yet. New postings are added regularly, so check back soon.
        </p>
      ) : (
        <ListingsBrowser listings={listings} sources={sources} skills={skills} pageSize={PAGE_SIZE} />
      )}
    </div>
  )
}
