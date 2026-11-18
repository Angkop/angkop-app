import * as cheerio from 'cheerio'
import { DESCRIPTION_CATEGORIES, type DescriptionSection } from '@angkop/shared'
import { MAX_DESCRIPTION_LENGTH } from './constants'
import { categorizeSections } from './description-categorizer'

const MAX_HEADING_LENGTH = 60
const MAX_HEADING_WORDS = 8
const MAX_KEYWORD_HEADING_WORDS = 5

// Words a heading can carry without being about a category on their own ("Key
// Responsibilities", "Job Requirements", "Benefits & Perks").
const HEADING_FILLER_WORDS = new Set([
  'the', 'our', 'your', 'key', 'main', 'core', 'job', 'role', 'position', 'additional', 'general', 'and', '&',
  'other', 'more', 'details', 'information', 'about', 'you', 'we', 'will', 'what', 'is', 'are', 'a'
])

const CATEGORY_KEYWORD_WORDS = DESCRIPTION_CATEGORIES.flatMap((category) =>
  category.keywords.flatMap((keyword) => keyword.split(/[\s-]+/))
)

const BULLET_MARKER = /^\s*(?:[-*•▪●◦·‣▸►✓✔]|\d{1,2}[.)])\s+/
const LEADING_DECORATION = /^[\s#*_>•\-–—:]+/u
const TRAILING_DECORATION = /[\s:*_\-–—]+$/u
const EMOJI = /[\p{Extended_Pictographic}️‍]/gu

function isCategoryWord(word: string): boolean {
  return CATEGORY_KEYWORD_WORDS.some(
    (keyword) => word === keyword || word === `${keyword}s` || (keyword.length >= 6 && word.startsWith(keyword))
  )
}

function cleanHeading(text: string): string {
  return text
    .replace(EMOJI, ' ')
    .replace(LEADING_DECORATION, '')
    .replace(TRAILING_DECORATION, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// A short phrase made only of category vocabulary and filler ("Key Responsibilities",
// "What You'll Do", "Skills & Qualifications"). Stricter than "contains a keyword", so a
// short bullet like "Strong Python skills" is not mistaken for a heading.
function isCategoryPhrase(cleaned: string): boolean {
  const words = cleaned
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0 || words.length > MAX_KEYWORD_HEADING_WORDS) return false
  const wordsOnly = words.map((word) => word.replace(/[^a-z'&]/g, ''))
  return (
    wordsOnly.every((word) => HEADING_FILLER_WORDS.has(word) || isCategoryWord(word) || word === "you'll" || word === 'do') &&
    wordsOnly.some((word) => isCategoryWord(word))
  )
}

// Recognises the heading styles postings actually use: a line ending in a colon, an
// ALL-CAPS line, a markdown/emoji-prefixed line, or a bare category phrase. Returns the
// cleaned heading text, or null if the line reads as ordinary content.
export function detectHeading(raw: string): string | null {
  const text = raw.replace(/\s+/g, ' ').trim()
  if (!text || text.length > MAX_HEADING_LENGTH + 20) return null

  const cleaned = cleanHeading(text)
  if (!cleaned || cleaned.length > MAX_HEADING_LENGTH) return null
  if (cleaned.split(' ').length > MAX_HEADING_WORDS) return null
  if (/[.!?;,]$/.test(cleaned)) return null

  if (/:\s*$/.test(text)) return cleaned
  if (/^#{1,6}\s/.test(text)) return cleaned
  if (/[A-Z]{3}/.test(cleaned) && cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned)) return cleaned
  if (isCategoryPhrase(cleaned)) return cleaned
  return null
}

// "Requirements: 3+ years of Python" — a category phrase, a colon, then the content on the
// same line. Only category phrases split this way, so "Salary: $50k" stays one item.
function splitInlineHeading(line: string): { heading: string; rest: string } | null {
  const match = line.match(/^(.{2,40}?):\s+(\S.*)$/)
  if (!match) return null
  const heading = cleanHeading(match[1])
  return heading && isCategoryPhrase(heading) ? { heading, rest: match[2].trim() } : null
}

type Block = { kind: 'heading'; text: string } | { kind: 'item'; text: string }

const BLOCK_TAGS = new Set(['p', 'ul', 'ol', 'div', 'section', 'article', 'main', 'table', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

// Splits a description's HTML into sections by its own headings, instead of flattening
// everything into one paragraph. Postings write headings several ways — real <h1-h6> tags, a
// <p> that is one bolded phrase, a bold lead-in followed by text ("<strong>Requirements:
// </strong> 3+ years..."), or plain lines like "REQUIREMENTS" and "What you'll do:" — all of
// them start a new section. Everything else (paragraphs, list items, <br>-separated lines)
// becomes an item in whichever section is currently open. Content before the first heading
// has heading: null. Sorting these raw sections into the fixed accordion categories is a
// separate step — see categorizeSections.
export function parseDescriptionSections(html: string): DescriptionSection[] {
  const $ = cheerio.load(html)
  const blocks: Block[] = []

  // cheerio's .text() concatenates descendant text nodes with no separator, so a <br> or a
  // nested block element (e.g. <p> inside <li>) between two sentences collapses into nothing
  // ("...required.Join a German tech company..."). Replacing them with a newline first keeps
  // the whitespace a reader would actually see.
  function textWithBreaks(element: ReturnType<typeof $>): string {
    element.find('br, p, div').after('\n')
    return element.text().replace(/\s*\n\s*/g, ' ').trim()
  }

  function isBoldOnly(element: ReturnType<typeof $>): string | null {
    const children = element.children()
    if (children.length !== 1) return null
    const onlyChild = children.first()
    if (!onlyChild.is('strong, b')) return null
    const fullText = element.text().trim()
    const childText = onlyChild.text().trim()
    return fullText && fullText === childText ? fullText : null
  }

  function pushItem(text: string) {
    const stripped = text.replace(BULLET_MARKER, '').replace(/\s+/g, ' ').trim()
    if (stripped.length > 1 && /[\p{L}\p{N}]/u.test(stripped)) blocks.push({ kind: 'item', text: stripped })
  }

  function pushHeading(text: string) {
    const cleaned = cleanHeading(text)
    if (cleaned) blocks.push({ kind: 'heading', text: cleaned })
  }

  // One line of prose: a heading, a heading with its content after the colon, or an item.
  function pushLine(line: string) {
    const trimmed = line.trim()
    if (!trimmed) return
    if (BULLET_MARKER.test(trimmed)) {
      pushItem(trimmed)
      return
    }
    const inline = splitInlineHeading(trimmed)
    if (inline) {
      pushHeading(inline.heading)
      pushItem(inline.rest)
      return
    }
    const heading = detectHeading(trimmed)
    if (heading) pushHeading(heading)
    else pushItem(trimmed)
  }

  function walk(element: ReturnType<typeof $>) {
    const node = element.get(0)
    const tag = node && node.type === 'tag' ? node.name : ''

    if (/^h[1-6]$/.test(tag)) {
      pushHeading(element.text())
      return
    }

    if (tag === 'ul' || tag === 'ol') {
      element.children('li').each((_, li) => {
        const text = textWithBreaks($(li))
        const headingLike = detectHeading(text)
        // A list whose "items" are really headings ("<li><strong>Requirements:</strong></li>").
        if (headingLike && isBoldOnly($(li))) pushHeading(headingLike)
        else pushItem(text)
      })
      return
    }

    // A wrapper around real blocks: descend instead of flattening it into one item.
    if (
      (tag === 'div' || tag === 'section' || tag === 'article' || tag === 'main') &&
      element.children().toArray().some((child) => child.type === 'tag' && BLOCK_TAGS.has(child.name))
    ) {
      element.contents().each((_, child) => {
        if (child.type === 'tag') walk($(child))
        else if (child.type === 'text') pushLine($(child).text())
      })
      return
    }

    const boldOnly = isBoldOnly(element)
    if (boldOnly) {
      pushHeading(boldOnly)
      return
    }

    // "<p><strong>Requirements:</strong> 3+ years...</p>" — a bold lead-in is a heading and
    // the rest of the paragraph is its first item.
    const firstChild = element.children().first()
    const lead = firstChild.is('strong, b') && element.contents().first().get(0) === firstChild.get(0) ? firstChild : null
    if (lead) {
      const headingText = lead.text().trim()
      const leadHeading = headingText ? detectHeading(headingText) : null
      if (leadHeading && /:\s*$/.test(headingText)) {
        lead.remove()
        pushHeading(leadHeading)
        element.find('br').replaceWith('\n')
        element
          .text()
          .split('\n')
          .forEach(pushLine)
        return
      }
    }

    element.find('br').replaceWith('\n')
    element.find('p, div').after('\n')
    element
      .text()
      .split('\n')
      .forEach(pushLine)
  }

  $('body')
    .children()
    .each((_, element) => {
      walk($(element))
    })

  const sections: DescriptionSection[] = [{ heading: null, items: [] }]
  for (const block of blocks) {
    if (block.kind === 'heading') sections.push({ heading: block.text, items: [] })
    else sections[sections.length - 1].items.push(block.text)
  }
  return sections.filter((section) => section.items.length > 0)
}

// Parses a description and files it under the fixed accordion categories. This is what the
// sources call; parseDescriptionSections alone returns the posting's own headings.
export function buildDescriptionSections(html: string): DescriptionSection[] {
  return categorizeSections(parseDescriptionSections(html))
}

// Plain-text descriptions (Headcount Labs) arrive with newlines and no markup. Turning each
// line into a <p> and each run of bullet lines into a <ul> lets them go through the same
// parser as the HTML sources.
export function plainTextToHtml(text: string): string {
  const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const html: string[] = []
  let listItems: string[] = []
  const flushList = () => {
    if (listItems.length > 0) html.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join('')}</ul>`)
    listItems = []
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      continue
    }
    if (BULLET_MARKER.test(line)) {
      listItems.push(escape(line.replace(BULLET_MARKER, '')))
    } else {
      flushList()
      html.push(`<p>${escape(line)}</p>`)
    }
  }
  flushList()
  return html.join('')
}

export function joinSections(sections: DescriptionSection[]): string {
  return sections
    .flatMap((section) => (section.heading ? [section.heading, ...section.items] : section.items))
    .join('. ')
}

export function flattenSections(sections: DescriptionSection[]): string {
  return joinSections(sections).slice(0, MAX_DESCRIPTION_LENGTH)
}
