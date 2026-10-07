// Detects what language a posting is WRITTEN IN (via franc's statistical detection on the
// description text) — distinct from lib/language-detection.ts's detectMentionedLanguages,
// which keyword-matches language names explicitly MENTIONED in the text (e.g. "German
// required"). Different inputs (ISO-639-3 codes vs. free-text regex) and different
// questions, so the two language-name lists aren't merged.

// franc (ISO 639-3) -> a display name, only for languages worth labeling on the detail
// page. Unrecognized/unlisted codes stay null rather than surfacing a raw ISO code.
const LANGUAGE_NAMES: Record<string, string> = {
  deu: 'German',
  fra: 'French',
  spa: 'Spanish',
  ita: 'Italian',
  nld: 'Dutch',
  por: 'Portuguese',
  pol: 'Polish',
  rus: 'Russian',
  ukr: 'Ukrainian',
  cmn: 'Chinese',
  jpn: 'Japanese',
  kor: 'Korean',
  vie: 'Vietnamese',
  tha: 'Thai',
  hin: 'Hindi',
  arb: 'Arabic',
  heb: 'Hebrew',
  tur: 'Turkish',
  ell: 'Greek',
  swe: 'Swedish',
  nob: 'Norwegian',
  dan: 'Danish',
  fin: 'Finnish',
  ces: 'Czech',
  ron: 'Romanian',
  hun: 'Hungarian',
  tgl: 'Tagalog'
}

// franc-min is ESM-only; this package is CommonJS, so it's loaded via dynamic import
// rather than a static one (tsc rejects a static import of an ESM package — TS1479).
// franc needs real sentence-length text to be confident; a short/ambiguous result ('und')
// is treated the same as English — i.e. no language notice shown — since guessing wrong
// here would be more misleading than saying nothing.
export async function detectLanguage(text: string): Promise<string | null> {
  const { franc } = await import('franc-min')
  const code = franc(text, { minLength: 20 })
  return LANGUAGE_NAMES[code] ?? null
}
