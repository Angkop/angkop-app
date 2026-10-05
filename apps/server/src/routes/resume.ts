import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/authenticate'
import { parseResume } from '../lib/ml-client'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'application/pdf')
})

export const resumeRouter = Router()

// Dashboard-only — parses a resume for the Import from resume flow (Profile page +
// Onboarding's About step) and returns structured fields for the user to review before
// anything is written to their profile. The uploaded file itself is never persisted.
resumeRouter.post('/parse', requireAuth, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Attach a PDF resume file' })
    return
  }

  const parsed = await parseResume({
    fileBase64: req.file.buffer.toString('base64'),
    mimeType: req.file.mimetype
  })
  res.json(parsed)
})
