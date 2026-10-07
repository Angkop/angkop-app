import { Banknote, Briefcase, Globe, Languages, MapPin } from 'lucide-react'
import { EMPLOYMENT_TYPE_LABELS, WORK_SETUP_LABELS } from '@angkop/shared'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import type { ListingDetail } from '../types'

function formatSalaryRange(salaryMin: number | null, salaryMax: number | null): string | null {
  if (salaryMin === null && salaryMax === null) return null
  const format = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
  if (salaryMin !== null && salaryMax !== null) return `${format(salaryMin)} – ${format(salaryMax)}/yr`
  return `${format(salaryMin ?? salaryMax ?? 0)}/yr`
}

// The class names and data-angkop-* attributes below are a scraper contract shared with
// apps/extension/src/content/content.js's scrapeDemoPlatform() and the static demo page at
// apps/web/public/demo/job-listing.html — keep all three in sync if this markup changes.
export function ListingCard({ listing }: { listing: ListingDetail }) {
  const facts = [
    { icon: MapPin, label: 'Location', value: listing.location },
    { icon: Globe, label: 'Work Setup', value: listing.workSetup ? WORK_SETUP_LABELS[listing.workSetup] : null },
    {
      icon: Briefcase,
      label: 'Employment Type',
      value: listing.employmentType ? EMPLOYMENT_TYPE_LABELS[listing.employmentType] : null
    },
    { icon: Banknote, label: 'Salary', value: formatSalaryRange(listing.salaryMin, listing.salaryMax) }
  ]

  // Every listing renders through this same Accordion shape — no per-job special casing.
  // A source with no heading structure just means a single "Overview" item and nothing
  // else; it never falls back to a different layout.
  const sections = listing.descriptionSections.map((section, index) => ({
    value: `section-${index}`,
    label: section.heading ?? 'Overview',
    items: section.items
  }))
  const defaultOpenValues = sections.length > 0 ? [sections[0].value] : []

  return (
    <div
      className="job-listing rounded-lg border border-border bg-card p-6 shadow-sm"
      data-angkop-platform="demo"
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

      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 rounded-md border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{label}:</span>
            <span className={value ? 'font-medium text-foreground' : 'text-muted-foreground italic'}>
              {value ?? 'Not specified'}
            </span>
          </div>
        ))}
      </div>

      {listing.detectedLanguage ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-4 py-2 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Languages className="size-3.5 shrink-0" />
            This posting is in {listing.detectedLanguage}.
          </span>
          <a
            href={`https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(listing.sourceUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-medium text-primary hover:underline"
          >
            Translate original
          </a>
        </div>
      ) : null}

      {/* Full flattened text for the extension's scraper contract — the Accordion below is
          what sighted users actually read. */}
      <p className="job-description sr-only">{listing.description}</p>

      {sections.length > 0 ? (
        <Accordion type="multiple" defaultValue={defaultOpenValues} className="mt-4">
          {sections.map((section) => (
            <AccordionItem key={section.value} value={section.value}>
              <AccordionTrigger className="font-medium text-foreground">{section.label}</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground italic">No structured details were parsed for this listing.</p>
      )}

      <div className="mt-6 border-t border-border pt-4">
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Skills</h2>
        {listing.requiredSkills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {listing.requiredSkills.map((skill) => (
              <Badge key={skill} className="job-skill">
                {skill}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No skills identified for this listing.</p>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <Languages className="size-3.5" />
          Languages Mentioned
        </h2>
        {listing.mentionedLanguages.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {listing.mentionedLanguages.map((language) => (
              <Badge key={language} variant="outline">
                {language}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No languages mentioned in this posting.</p>
        )}
      </div>
    </div>
  )
}
