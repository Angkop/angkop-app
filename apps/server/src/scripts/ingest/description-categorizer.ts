import {
  DESCRIPTION_CATEGORIES,
  findDescriptionCategoryByHeading,
  type DescriptionCategoryValue,
  type DescriptionSection
} from '@angkop/shared'

// Cues for sorting a sentence or bullet into a category when the posting gave it no usable
// heading. Checked in CUE_ORDER, first hit wins: the narrow, unambiguous categories come
// before the broad ones ("bonus points" is nice-to-have, "performance bonus" is a benefit,
// and a bullet that starts with a duty verb is a duty even if it mentions "strong
// understanding").
const NICE_TO_HAVE_CUES =
  /\b(nice to have|a plus|an advantage|is a bonus|bonus points?|would be (a )?(great|nice|an advantage|beneficial)|preferred|ideally|good to have|not required but|desirable)\b/i

const BENEFITS_CUES =
  /\b(health(care)? (insurance|coverage|plan|benefits)|hmo|medical (insurance|coverage|benefits|allowance)|dental|vision insurance|life insurance|paid (time off|leave|vacation|holidays?|sick)|pto|vacation|sick leave|maternity|paternity|parental|13th[- ]month|14th[- ]month|401\s?\(?k\)?|retirement|pension|stock options?|equity|esop|allowance|stipend|gym|wellness|free (lunch|meals|snacks|coffee)|team[- ](building|outings?)|flexible (hours|schedule|working|work)|learning (budget|stipend)|training (budget|allowance)|professional development|career growth|performance bonus|signing bonus|sign-on bonus|annual bonus|we offer|perks?|benefits?)\b/i

const DUTY_VERB_START =
  /^(?:[-•*]\s*)?(build|design|develop|implement|maintain|manage|lead|create|write|collaborate|partner|work(?:ing)? (?:with|closely|on|across)|own|drive|deliver|ensure|support|coordinate|monitor|analy[sz]e|prepare|conduct|participate|contribute|review|test|deploy|optimi[sz]e|troubleshoot|document|plan|oversee|handle|assist|provide|perform|communicate|identify|research|define|mentor|execute|respond|resolve|operate|process|schedule|organi[sz]e|train|report|architect|ship|craft|run)\b/i

const REQUIREMENT_CUES =
  /\b(\d{1,2}\+?\s*(?:-|–|to)?\s*\d{0,2}\s*\+?\s*years?|bachelor'?s?|master'?s?|degree|diploma|certification|certified|licen[sc]e|proficien(t|cy)|fluen(t|cy)|knowledge of|experience (in|with|of|as|using|building|working)|experienced (in|with)|familiar(ity)? with|ability to|capable of|able to|must (have|be)|should (have|be)|required|minimum|strong (understanding|knowledge|background|command|skills?)|\w+ skills?|excellent (communication|written|verbal)|proven (track|experience|ability)|background in|expertise in|hands-on experience|you (have|are|bring|possess|hold)|you've|we'?re looking for|looking for (a|an|someone|candidates?))\b/i

const DUTY_PHRASE_CUES =
  /\b(you will|you'll|you’ll|you would|will be (responsible|working|involved|expected)|responsible for|responsibilities include|your (role|day|main|key)|day[- ]to[- ]day|duties (include|will)|in this role)\b/i

const CUES: { category: DescriptionCategoryValue; test: (text: string) => boolean }[] = [
  { category: 'nice-to-have', test: (text) => NICE_TO_HAVE_CUES.test(text) },
  { category: 'benefits', test: (text) => BENEFITS_CUES.test(text) },
  { category: 'responsibilities', test: (text) => DUTY_VERB_START.test(text) },
  { category: 'requirements', test: (text) => REQUIREMENT_CUES.test(text) },
  { category: 'responsibilities', test: (text) => DUTY_PHRASE_CUES.test(text) }
]

// A piece longer than this reads as prose rather than a bullet, so the category carried over
// from the line before it no longer applies.
const MAX_STICKY_LENGTH = 160
// Paragraphs longer than this are split into sentences before classifying, since one
// paragraph often mixes "what we do" with "what you'll do".
const SPLIT_PARAGRAPH_LENGTH = 80

function cueFor(text: string): DescriptionCategoryValue | null {
  return CUES.find((cue) => cue.test(text))?.category ?? null
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((sentence) => sentence.trim()).filter(Boolean)
}

// Sorts items that have no usable heading by what they say. A bullet or sentence with no cue
// of its own stays with the line before it (a list of duties is one category even if only
// some lines say "you will"); one with no cue and nothing before it goes to `fallback`.
function classifyItems(items: string[], fallback: DescriptionCategoryValue): { category: DescriptionCategoryValue; text: string }[] {
  const pieces = items.flatMap((item) => (item.length > SPLIT_PARAGRAPH_LENGTH ? splitSentences(item) : [item]))
  const classified: { category: DescriptionCategoryValue; text: string }[] = []
  let current: DescriptionCategoryValue | null = null

  for (const piece of pieces) {
    const cue = cueFor(piece)
    if (cue) current = cue
    else if (piece.length > MAX_STICKY_LENGTH) current = null
    classified.push({ category: cue ?? current ?? fallback, text: piece })
  }
  return classified
}

// Files a posting's raw sections under the fixed accordion categories (see
// DESCRIPTION_CATEGORIES): one section per category, in the fixed order, with the heading set
// to that category's label so the listing page's accordion lands every section on the right
// item. A section whose heading names a category keeps that category; one with no heading, or
// a heading nobody recognises ("The Gig"), is sorted line by line from what it says.
export function categorizeSections(sections: DescriptionSection[]): DescriptionSection[] {
  const byCategory = new Map<DescriptionCategoryValue, string[]>()
  const add = (category: DescriptionCategoryValue, items: string[]) => {
    byCategory.set(category, [...(byCategory.get(category) ?? []), ...items])
  }

  for (const section of sections) {
    const named = section.heading === null ? null : findDescriptionCategoryByHeading(section.heading)
    if (named) {
      add(named.value, section.items)
      continue
    }
    const fallback: DescriptionCategoryValue = section.heading === null ? 'overview' : 'other'
    for (const { category, text } of classifyItems(section.items, fallback)) add(category, [text])
  }

  return DESCRIPTION_CATEGORIES.flatMap((category) => {
    const items = byCategory.get(category.value)
    return items && items.length > 0 ? [{ heading: category.label, items }] : []
  })
}
