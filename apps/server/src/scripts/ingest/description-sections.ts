import * as cheerio from 'cheerio'
import type { DescriptionSection } from '@angkop/shared'
import { MAX_DESCRIPTION_LENGTH } from './constants'

// Splits a description's HTML into sections by its own headings, instead of flattening
// everything into one paragraph. These sources use two different heading styles — real
// <h1-h6> tags (Arbeitnow sometimes), and a <p> whose entire content is one bolded phrase
// (both sources, e.g. "<p><strong>Requirements</strong></p>") — both are treated as a new
// section's heading; everything else (paragraphs, list items) becomes an item in whichever
// section is currently open. Content before the first heading has heading: null.
export function parseDescriptionSections(html: string): DescriptionSection[] {
  const $ = cheerio.load(html)
  const sections: DescriptionSection[] = [{ heading: null, items: [] }]
  const current = () => sections[sections.length - 1]

  function isPseudoHeading(element: ReturnType<typeof $>): string | null {
    const children = element.children()
    if (children.length !== 1) return null
    const onlyChild = children.first()
    if (!onlyChild.is('strong, b')) return null
    const fullText = element.text().trim()
    const childText = onlyChild.text().trim()
    return fullText && fullText === childText ? fullText : null
  }

  $('body')
    .children()
    .each((_, element) => {
      const $element = $(element)
      const tag = element.type === 'tag' ? element.name : ''

      if (/^h[1-6]$/.test(tag)) {
        const heading = $element.text().trim()
        if (heading) sections.push({ heading, items: [] })
        return
      }

      if (tag === 'p') {
        const pseudoHeading = isPseudoHeading($element)
        if (pseudoHeading) {
          sections.push({ heading: pseudoHeading, items: [] })
          return
        }
        const text = $element.text().trim()
        if (text) current().items.push(text)
        return
      }

      if (tag === 'ul' || tag === 'ol') {
        $element.find('li').each((_li, li) => {
          const text = $(li).text().trim()
          if (text) current().items.push(text)
        })
        return
      }

      const text = $element.text().trim()
      if (text) current().items.push(text)
    })

  return sections.filter((section) => section.items.length > 0)
}

export function flattenSections(sections: DescriptionSection[]): string {
  return sections
    .flatMap((section) => (section.heading ? [section.heading, ...section.items] : section.items))
    .join('. ')
    .slice(0, MAX_DESCRIPTION_LENGTH)
}
