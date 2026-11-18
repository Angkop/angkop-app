import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { CAREER_LEVEL_LABELS, EMPLOYMENT_TYPE_LABELS, WORK_SETUP_LABELS } from '@angkop/shared'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { DescriptionAccordion } from '@/modules/listing-detail-page/components/description-accordion'
import { ListingFacts } from '@/modules/listing-detail-page/components/listing-facts'
import { ViewTracker } from '@/modules/listing-detail-page/components/view-tracker'
import { getListing } from '@/modules/listing-detail-page/queries'
import { MatchActions } from './components/match-actions'
import { MatchInsightSections } from './components/match-insight-sections'
import { MatchScoreCard } from './components/match-score-card'

// A match's own page, laid out like a post on the Magic UI blog template: a header band with
// the back button, tags and a large title, then the content column beside a sticky sidebar.
// The listing is public and fetched on the server; the score and its explanation are the
// signed-in user's, so they load on the client (see the components under ./components).
export async function MatchDetailPage({ jobId }: { jobId: string }) {
  const listing = await getListing(jobId)
  if (!listing) notFound()

  const tags = [
    listing.sourceName,
    listing.workSetup ? WORK_SETUP_LABELS[listing.workSetup] : null,
    listing.employmentType ? EMPLOYMENT_TYPE_LABELS[listing.employmentType] : null,
    listing.experienceLevel ? CAREER_LEVEL_LABELS[listing.experienceLevel] : null
  ].filter((tag): tag is string => Boolean(tag))

  return (
    <div>
      <ViewTracker jobId={listing.id} />

      <header className="mb-10 border-b border-border pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/matches"
            aria-label="Back to all matches"
            className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
          >
            <ArrowLeft className="size-4" />
          </Link>
          {tags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
          {listing.title}
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          {listing.company}
          {listing.location ? ` · ${listing.location}` : ''}
        </p>
      </header>

      {/* The sidebar comes first in the markup so a phone shows the score and actions before the
          long read; from lg it moves to the right. */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <aside className="lg:order-2">
          <div className="space-y-4 lg:sticky lg:top-24">
            <MatchScoreCard jobId={listing.id} />
            <MatchActions
              jobId={listing.id}
              title={listing.title}
              company={listing.company}
              sourceUrl={listing.sourceUrl}
              sourceName={listing.sourceName}
            />
          </div>
        </aside>

        <div className="min-w-0 space-y-12 lg:order-1">
          <MatchInsightSections jobId={listing.id} jobTitle={listing.title} />

          <section aria-labelledby="about-the-role-heading">
            <h2 id="about-the-role-heading" className="font-display text-xl font-semibold text-foreground">
              About the role
            </h2>
            <ListingFacts listing={listing} />
            <DescriptionAccordion descriptionSections={listing.descriptionSections} />
          </section>
        </div>
      </div>
    </div>
  )
}
