import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { ListingDetail } from '../types'
import { groupDescriptionSections } from '../utils'

// Every listing renders through the same fixed category order (Overview, Responsibilities,
// Requirements, Nice to have, Benefits, Additional details) regardless of how the source
// worded its own headings — see groupDescriptionSections. A listing just skips whichever
// categories it has nothing for; it never shows an empty one.
export function DescriptionAccordion({ descriptionSections }: { descriptionSections: ListingDetail['descriptionSections'] }) {
  const sections = groupDescriptionSections(descriptionSections)
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
