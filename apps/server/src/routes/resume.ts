import { Router } from 'express'
import multer from 'multer'
import type { ParsedResumeProfile } from '@angkop/shared'
import { requireAuth } from '../middleware/authenticate'
import { MlServiceError, parseResume } from '../lib/ml-client'
import {
  detectResumeFileKind,
  extractContactFields,
  extractResumeText,
  hashResumeText
} from '../lib/resume-extraction'
import {
  checkQuota,
  getCachedParse,
  recordGeminiFailure,
  recordGeminiSuccess,
  recordUserParse,
  setCachedParse
} from '../lib/resume-quota'

const ACCEPTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ACCEPTED_MIME_TYPES.has(file.mimetype))
})

export const resumeRouter = Router()

const MAX_ML_RETRIES = 2

async function callMlWithRetry(request: Parameters<typeof parseResume>[0]): Promise<ParsedResumeProfile> {
  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_ML_RETRIES; attempt++) {
    try {
      return await parseResume(request)
    } catch (error) {
      lastError = error
      const retryable = error instanceof MlServiceError && (error.status === 429 || error.status >= 500)
      if (!retryable || attempt === MAX_ML_RETRIES) break
      const backoffMs = 500 * 2 ** attempt + Math.random() * 250
      await new Promise((resolve) => setTimeout(resolve, backoffMs))
    }
  }
  throw lastError
}

// Dashboard-only — parses a resume for the Import from resume flow (Profile page +
// Onboarding's About step) and returns structured fields for the user to review before
// anything is written to their profile. The uploaded file itself is never persisted.
//
// Flow: extract text locally -> per-user content-hash cache (zero Gemini calls on a
// repeat upload) -> per-user/global quota + circuit breaker -> regex contact extraction
// -> Gemini (with retry) -> regex fields merged back over the model's output -> cached.
resumeRouter.post('/parse', requireAuth, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Attach a PDF or DOCX resume file' })
    return
  }

  // The browser-reported mimetype (checked by multer's fileFilter above) is client
  // controlled — the magic bytes are what the file actually is.
  const kind = detectResumeFileKind(req.file.buffer)
  if (!kind) {
    res.status(400).json({ error: "That file doesn't look like a PDF or DOCX" })
    return
  }

  let resumeText: string
  try {
    resumeText = await extractResumeText(req.file.buffer, kind)
  } catch (error) {
    res.status(422).json({ error: error instanceof Error ? error.message : "Couldn't read that file" })
    return
  }

  const userId = res.locals.userId as string
  const textHash = hashResumeText(resumeText)

  const cached = await getCachedParse(userId, textHash)
  if (cached) {
    res.set('X-Resume-Parse-Source', 'cache')
    res.json(cached)
    return
  }

  const quotaBlock = await checkQuota(userId)
  if (quotaBlock) {
    if (quotaBlock.kind === 'cooldown') {
      res.set('Retry-After', String(quotaBlock.retryAfterSeconds))
      res.status(429).json({ error: 'Please wait a moment before uploading again' })
      return
    }
    if (quotaBlock.kind === 'daily-limit' || quotaBlock.kind === 'weekly-limit') {
      res.status(429).json({ error: "You've reached your resume import limit for now — try again later" })
      return
    }
    res.status(503).json({ error: 'Resume parsing is temporarily paused — try again soon' })
    return
  }

  const contact = extractContactFields(resumeText)
  await recordUserParse(userId)

  let parsed: ParsedResumeProfile
  try {
    parsed = await callMlWithRetry({
      resumeText,
      email: contact.email,
      phone: contact.phone,
      links: contact.links
    })
    await recordGeminiSuccess()
  } catch {
    await recordGeminiFailure()
    res.status(503).json({ error: 'Resume parsing is not available right now' })
    return
  }

  // Regex results are more reliable than the model's for these fields — they win.
  const merged: ParsedResumeProfile = {
    ...parsed,
    email: contact.email ?? parsed.email,
    phone: contact.phone ?? parsed.phone,
    links: contact.links.length > 0 ? contact.links : parsed.links
  }

  await setCachedParse(userId, textHash, merged)
  res.set('X-Resume-Parse-Source', 'gemini')
  res.json(merged)
})
