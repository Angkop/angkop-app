import { Badge } from '@/components/ui/badge'
import type { ListingDetail } from '../types'
import { DescriptionAccordion } from './description-accordion'
import { LanguageNotice } from './language-notice'
import { ListingFacts } from './listing-facts'
import { MentionedLanguagesList } from './mentioned-languages-list'
import { SkillsList } from './skills-list'

// The class names and data-angkop-* attributes below are a scraper contract shared with
// apps/extension/src/content/content.js's scrapeDemoPlatform() and the static demo page at
// apps/web/public/demo/job-listing.html — keep all three in sync if this markup changes.
export function ListingCard({ listing }: { listing: ListingDetail }) {
  return (
    <div
      className="job-listing rounded-lg border border-border bg-card p-6 shadow-sm"
      data-angkop-platform="angkop"
      data-angkop-platform-job-id={listing.platformJobId}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="job-title text-2xl font-semibold">{listing.title}</h1>
          <p className="job-company mt-1 text-sm text-muted-foreground">{listing.company}</p>
        </div>
        <Badge variant="outline" className="shrink-0">
          {listing.sourceName}
        </Badge>
      </div>

      <ListingFacts listing={listing} />

      {listing.detectedLanguage ? (
        <LanguageNotice detectedLanguage={listing.detectedLanguage} sourceUrl={listing.sourceUrl} />
      ) : null}

      {/* Full flattened text for the extension's scraper contract — the Accordion below is
          what sighted users actually read. */}
      <p className="job-description sr-only">{listing.description}</p>

      <DescriptionAccordion descriptionSections={listing.descriptionSections} />

      <SkillsList skills={listing.requiredSkills} />

      <MentionedLanguagesList languages={listing.mentionedLanguages} />
    </div>
  )
}
