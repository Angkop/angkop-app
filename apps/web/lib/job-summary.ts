// The start of a job description as one plain-text line: markup stripped, whitespace collapsed,
// cut at a word boundary. Sources write descriptions as HTML or Markdown, so it's cleaned before
// it's measured. Returns an empty string for a description with no text in it.
export function summarizeDescription(description: string, maxLength: number): string {
  const text = description
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[*_#>`]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLength) return text

  const clipped = text.slice(0, maxLength)
  const lastSpace = clipped.lastIndexOf(' ')
  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).replace(/[\s,.;:-]+$/, '')}…`
}
