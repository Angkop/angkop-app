import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import type { ListingDetail } from '../types'
import { groupDescriptionSections } from '../utils'

// Every listing renders through the same fixed category order (Overview, Responsibilities,
// Requirements, Nice to have, Benefits, Additional details) regardless of how the source
// worded its own headings — see groupDescriptionSections. Every category always shows up,
// even for a listing with nothing in it — opening it just shows why it's empty, instead of
// the category disappearing (which made "not mentioned" indistinguishable from "wasn't
// shown this item at all").
export function DescriptionAccordion({ descriptionSections }: { descriptionSections: ListingDetail['descriptionSections'] }) {
  const sections = groupDescriptionSections(descriptionSections)
  const defaultOpenValues = sections.length > 0 ? [sections[0].value] : []

  return (
    <Accordion type="multiple" defaultValue={defaultOpenValues} className="mt-4">
      {sections.map((section) => (
        <AccordionItem key={section.value} value={section.value}>
          <AccordionTrigger className="font-medium text-foreground">{section.label}</AccordionTrigger>
          <AccordionContent>
            {section.items.length > 0 ? (
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No details were parsed for this section.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
