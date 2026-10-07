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

  const [initialPage, sources, skills] = await Promise.all([
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

      {initialPage.total === 0 && !q && !source && !skill ? (
        <p className="text-sm text-muted-foreground">
          No real listings ingested yet. Run{' '}
          <code className="rounded bg-muted px-1 py-0.5">pnpm --filter @angkop/server run ingest:jobs</code> to pull
          some in.
        </p>
      ) : (
        <ListingsBrowser initialPage={initialPage} sources={sources} skills={skills} pageSize={PAGE_SIZE} />
      )}
    </div>
  )
}
