import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { ListingDetail } from '../types'

// Every listing renders through this same Accordion shape — no per-job special casing.
// A source with no heading structure just means a single "Overview" item and nothing
// else; it never falls back to a different layout.
export function DescriptionAccordion({ descriptionSections }: { descriptionSections: ListingDetail['descriptionSections'] }) {
  const sections = descriptionSections.map((section, index) => ({
    value: `section-${index}`,
    label: section.heading ?? 'Overview',
    items: section.items
  }))
  const defaultOpenValues = sections.length > 0 ? [sections[0].value] : []

  if (sections.length === 0) {
    return <p className="mt-4 text-sm text-muted-foreground italic">No structured details were parsed for this listing.</p>
  }

  return (
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
  )
}
