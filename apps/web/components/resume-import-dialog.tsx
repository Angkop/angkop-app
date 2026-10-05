'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Award,
  Briefcase,
  Check,
  FileText,
  FolderGit2,
  GraduationCap,
  Languages as LanguagesIcon,
  MapPin,
  Sparkles,
  TrendingUp,
  Upload,
  UserRound,
  type LucideIcon
} from 'lucide-react'
import { CAREER_LEVEL_LABELS, type ParsedResumeProfile } from '@angkop/shared'
import { API_URL } from '@/constants/api'
import { getStoredToken } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ErrorMessage } from '@/components/error-message'
import { BrandLoader } from '@/components/brand-loader'

const PARSING_STEPS = ['Uploading file', 'Reading document', 'Extracting skills & experience', 'Matching to your profile']

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

function ParsingSteps({ activeIndex }: { activeIndex: number }) {
  return (
    <ol className="mt-5 space-y-3 border-t border-border pt-4">
      {PARSING_STEPS.map((step, index) => {
        const status = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending'
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium transition-colors',
                status === 'done' && 'bg-primary text-primary-foreground',
                status === 'active' && 'border-2 border-primary text-primary',
                status === 'pending' && 'border border-border text-muted-foreground'
              )}
            >
              {status === 'done' ? <Check className="size-3" /> : index + 1}
            </span>
            <span
              className={cn(
                'text-sm transition-colors',
                status === 'pending' ? 'text-muted-foreground' : 'text-foreground',
                status === 'active' && 'font-medium'
              )}
            >
              {step}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function HighlightStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

function SummaryRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 text-sm last:border-b-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      <span className="max-w-[60%] text-right font-medium text-foreground">{value}</span>
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
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <DialogTitle>Import from resume</DialogTitle>
          </div>
          <DialogDescription>
            Upload a resume and we&apos;ll pull out your skills, experience, and education to fill in your profile.
          </DialogDescription>
        </DialogHeader>

        {stage === 'upload' ? (
          <label className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              <Upload className="size-5" />
            </span>
            <span className="text-sm font-medium text-foreground">Click to upload, or drag and drop</span>
            <span className="text-xs text-muted-foreground">PDF, up to 10MB</span>
            <input type="file" accept=".pdf" className="sr-only" onChange={handleFileChange} />
          </label>
        ) : null}

        {stage === 'parsing' ? (
          <div className="rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">Reading your resume</p>
              </div>
              <BrandLoader size="sm" />
            </div>

            <ParsingSteps activeIndex={stepIndex} />
          </div>
        ) : null}

        {stage === 'error' ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border p-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </span>
            <ErrorMessage>{errorMessage}</ErrorMessage>
          </div>
        ) : null}

        {stage === 'review' && parsed ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 rounded-2xl bg-muted/40 p-4 sm:grid-cols-3">
              <HighlightStat icon={UserRound} label="Headline" value={parsed.headline || 'Not found'} />
              <HighlightStat
                icon={TrendingUp}
                label="Career level"
                value={parsed.careerLevel ? CAREER_LEVEL_LABELS[parsed.careerLevel] : 'Not found'}
              />
              <HighlightStat icon={MapPin} label="Location" value={parsed.location || 'Not found'} />
            </div>

            <div className="rounded-2xl border border-border px-4">
              <SummaryRow
                icon={Sparkles}
                label="Skills"
                value={
                  parsed.skills.length > 0
                    ? `${parsed.skills.length} found — ${summarizeNames(parsed.skills.map((skill) => skill.name))}`
                    : 'None found'
                }
              />
              <SummaryRow
                icon={GraduationCap}
                label="Education"
                value={
                  parsed.education.length > 0
                    ? `${parsed.education.length} found — ${summarizeNames(parsed.education.map((entry) => entry.school))}`
                    : 'None found'
                }
              />
              <SummaryRow
                icon={Briefcase}
                label="Experience"
                value={
                  parsed.experience.length > 0
                    ? `${parsed.experience.length} found — ${summarizeNames(parsed.experience.map((entry) => `${entry.title} @ ${entry.company}`))}`
                    : 'None found'
                }
              />
              <SummaryRow
                icon={Award}
                label="Certifications"
                value={parsed.certifications.length > 0 ? `${parsed.certifications.length} found` : 'None found'}
              />
              <SummaryRow
                icon={FolderGit2}
                label="Projects"
                value={parsed.projects.length > 0 ? `${parsed.projects.length} found` : 'None found'}
              />
              <SummaryRow
                icon={LanguagesIcon}
                label="Languages"
                value={
                  parsed.languages.length > 0
                    ? summarizeNames(parsed.languages.map((entry) => entry.language))
                    : 'None found'
                }
              />
            </div>
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
