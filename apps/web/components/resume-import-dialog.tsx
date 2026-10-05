'use client'

import { useEffect, useRef, useState } from 'react'
import { FileText, Upload } from 'lucide-react'
import { CAREER_LEVEL_LABELS, type ParsedResumeProfile } from '@angkop/shared'
import { API_URL } from '@/constants/api'
import { getStoredToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorMessage } from '@/components/error-message'
import { BrandLoader } from '@/components/brand-loader'

const PARSING_STEPS = ['Reading file…', 'Extracting skills…', 'Matching experience…', 'Finalizing…']

type Stage = 'upload' | 'parsing' | 'review' | 'error'

async function requestParsedResume(file: File): Promise<ParsedResumeProfile> {
  const token = getStoredToken()
  const formData = new FormData()
  formData.append('resume', file)

  const response = await fetch(`${API_URL}/api/resume/parse`, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body: formData
  })

  if (!response.ok) {
    throw new Error(
      response.status === 503
        ? 'Resume parsing is not available right now'
        : "Couldn't read that file as a resume"
    )
  }

  return response.json() as Promise<ParsedResumeProfile>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  )
}

function summarizeNames(names: string[], max = 3): string {
  if (names.length === 0) return 'None found'
  const shown = names.slice(0, max).join(', ')
  const remaining = names.length - max
  return remaining > 0 ? `${shown} +${remaining} more` : shown
}

export function ResumeImportDialog({
  open,
  onOpenChange,
  onImport
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (parsed: ParsedResumeProfile) => void
}) {
  const [stage, setStage] = useState<Stage>('upload')
  const [parsed, setParsed] = useState<ParsedResumeProfile | null>(null)
  const [fileName, setFileName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const lastFileRef = useRef<File | null>(null)

  useEffect(() => {
    if (!open) {
      setStage('upload')
      setParsed(null)
      setFileName('')
      setErrorMessage('')
      lastFileRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (stage !== 'parsing') return
    setStepIndex(0)
    const interval = setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, PARSING_STEPS.length - 1))
    }, 900)
    return () => clearInterval(interval)
  }, [stage])

  async function runParse(file: File) {
    lastFileRef.current = file
    setFileName(file.name)
    setStage('parsing')
    try {
      const result = await requestParsedResume(file)
      setParsed(result)
      setStage('review')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong')
      setStage('error')
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) runParse(file)
  }

  function handleRetry() {
    if (lastFileRef.current) runParse(lastFileRef.current)
  }

  function handleImport() {
    if (!parsed) return
    onImport(parsed)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from resume</DialogTitle>
          <DialogDescription>
            Upload a resume and we&apos;ll pull out your skills, experience, and education to fill in your profile.
          </DialogDescription>
        </DialogHeader>

        {stage === 'upload' ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border p-8 text-center hover:border-foreground/30 hover:bg-muted/40">
            <Upload className="size-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Click to upload, or drag and drop</span>
            <span className="text-xs text-muted-foreground">PDF, up to 10MB</span>
            <input type="file" accept=".pdf" className="sr-only" onChange={handleFileChange} />
          </label>
        ) : null}

        {stage === 'parsing' ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border p-8 text-center">
            <BrandLoader size="md" />
            <div>
              <p className="text-sm font-medium text-foreground">{PARSING_STEPS[stepIndex]}</p>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="size-3.5" />
                {fileName}
              </p>
            </div>
          </div>
        ) : null}

        {stage === 'error' ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border p-8 text-center">
            <ErrorMessage>{errorMessage}</ErrorMessage>
          </div>
        ) : null}

        {stage === 'review' && parsed ? (
          <div className="rounded-lg border border-border px-4">
            <SummaryRow label="Headline" value={parsed.headline || 'Not found'} />
            <SummaryRow
              label="Career level"
              value={parsed.careerLevel ? CAREER_LEVEL_LABELS[parsed.careerLevel] : 'Not found'}
            />
            <SummaryRow label="Location" value={parsed.location || 'Not found'} />
            <SummaryRow
              label="Skills"
              value={
                parsed.skills.length > 0
                  ? `${parsed.skills.length} found — ${summarizeNames(parsed.skills.map((skill) => skill.name))}`
                  : 'None found'
              }
            />
            <SummaryRow
              label="Education"
              value={
                parsed.education.length > 0
                  ? `${parsed.education.length} found — ${summarizeNames(parsed.education.map((entry) => entry.school))}`
                  : 'None found'
              }
            />
            <SummaryRow
              label="Experience"
              value={
                parsed.experience.length > 0
                  ? `${parsed.experience.length} found — ${summarizeNames(parsed.experience.map((entry) => `${entry.title} @ ${entry.company}`))}`
                  : 'None found'
              }
            />
            <SummaryRow
              label="Certifications"
              value={parsed.certifications.length > 0 ? `${parsed.certifications.length} found` : 'None found'}
            />
            <SummaryRow
              label="Projects"
              value={parsed.projects.length > 0 ? `${parsed.projects.length} found` : 'None found'}
            />
            <SummaryRow
              label="Languages"
              value={
                parsed.languages.length > 0
                  ? summarizeNames(parsed.languages.map((entry) => entry.language))
                  : 'None found'
              }
            />
          </div>
        ) : null}

        <DialogFooter>
          {stage === 'error' ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleRetry}>
                Retry
              </Button>
            </>
          ) : null}
          {stage === 'review' ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleImport}>
                Import this
              </Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
