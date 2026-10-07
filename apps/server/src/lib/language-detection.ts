// Best-effort only: neither RemoteOK nor Arbeitnow expose a structured language-requirements
// field, so this scans free-text description for language names explicitly mentioned by the
// poster. A job with no match here isn't assumed to be English-only — it just means the
// posting never named a language, which is the common case. Never defaults to "English".
const COMMON_LANGUAGES = [
  'English',
  'German',
  'French',
  'Spanish',
  'Italian',
  'Portuguese',
  'Dutch',
  'Polish',
  'Russian',
  'Ukrainian',
  'Mandarin',
  'Cantonese',
  'Chinese',
  'Japanese',
  'Korean',
  'Vietnamese',
  'Thai',
  'Hindi',
  'Arabic',
  'Hebrew',
  'Turkish',
  'Greek',
  'Swedish',
  'Norwegian',
  'Danish',
  'Finnish',
  'Czech',
  'Romanian',
  'Hungarian',
  'Tagalog',
  'Filipino'
]

const LANGUAGE_PATTERNS = COMMON_LANGUAGES.map((language) => ({
  language,
  pattern: new RegExp(`\\b${language}\\b`, 'i')
}))

export function detectMentionedLanguages(text: string): string[] {
  return LANGUAGE_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ language }) => language)
}
