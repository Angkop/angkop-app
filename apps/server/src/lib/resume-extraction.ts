import { createHash } from 'node:crypto'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

export type ResumeFileKind = 'pdf' | 'docx'

const PDF_MAGIC = Buffer.from('%PDF-', 'ascii')
const DOCX_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04])

// Browser-reported MIME types are client-controlled and easy to spoof — the real file
// format is whatever its magic bytes say it is.
export function detectResumeFileKind(buffer: Buffer): ResumeFileKind | null {
  if (buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) return 'pdf'
  if (buffer.subarray(0, DOCX_MAGIC.length).equals(DOCX_MAGIC)) return 'docx'
  return null
}

const MIN_RESUME_TEXT_LENGTH = 200

export class ScannedResumeError extends Error {
  constructor() {
    super('This looks like a scanned or image-only document — upload a text-based PDF or DOCX instead')
  }
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer })
  try {
    const result = await parser.getText()
    return result.text
  } catch (error) {
    if (error instanceof Error && error.name === 'PasswordException') {
      throw new Error('This PDF is password-protected — remove the password and try again')
    }
    throw new Error("Couldn't read this PDF")
  } finally {
    await parser.destroy()
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

// NFKC folds visually-equivalent Unicode variants (common across resumes exported from
// different tools) before hashing, so two copies of the same resume text hash identically.
export function normalizeResumeText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function hashResumeText(normalizedText: string): string {
  // Lowercased for hashing only — the normalized (cased) text is still what gets sent to Gemini.
  return createHash('sha256').update(normalizedText.toLowerCase()).digest('hex')
}

export async function extractResumeText(buffer: Buffer, kind: ResumeFileKind): Promise<string> {
  const rawText = kind === 'pdf' ? await extractTextFromPdf(buffer) : await extractTextFromDocx(buffer)
  const normalized = normalizeResumeText(rawText)
  if (normalized.length < MIN_RESUME_TEXT_LENGTH) {
    throw new ScannedResumeError()
  }
  return normalized
}

export type ResumeLink = { label: string; url: string }

export type ExtractedContact = {
  email: string | null
  phone: string | null
  links: ResumeLink[]
}

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/

// Philippine mobile (09xx / +63 9xx) and landline numbers — loose enough to tolerate the
// spaces/dashes resumes format inconsistently.
const PH_PHONE_PATTERN = /(?:\+63|0)(?:[\s-]?\d){9,10}/

const URL_WITH_PROTOCOL_PATTERN = /\bhttps?:\/\/[^\s,;)]+/gi

// Resumes very often list LinkedIn/GitHub as a bare domain with no protocol
// ("linkedin.com/in/jane", "github.com/jane") — catch those too.
const BARE_DOMAIN_PATTERN = /\b(?:www\.)?(?:linkedin\.com|github\.com)\/\S+/gi

function normalizeUrl(url: string): string {
  const trimmed = url.replace(/[.,;)]+$/, '')
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

function labelForUrl(url: string): string {
  if (/linkedin\.com/i.test(url)) return 'LinkedIn'
  if (/github\.com/i.test(url)) return 'GitHub'
  return 'Portfolio'
}

// Regex results are more reliable than the model for these fields and become the source
// of truth over whatever Gemini guesses — the model is told not to guess them at all.
export function extractContactFields(text: string): ExtractedContact {
  const email = text.match(EMAIL_PATTERN)?.[0] ?? null
  const phone = text.match(PH_PHONE_PATTERN)?.[0]?.trim() ?? null
  const rawUrls = [...(text.match(URL_WITH_PROTOCOL_PATTERN) ?? []), ...(text.match(BARE_DOMAIN_PATTERN) ?? [])]
  const urls = Array.from(new Set(rawUrls.map(normalizeUrl)))
  const links = urls.slice(0, 5).map((url) => ({ label: labelForUrl(url), url }))
  return { email, phone, links }
}
