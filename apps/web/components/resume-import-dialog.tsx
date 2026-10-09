'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Award,
  Briefcase,
  FileText,
  FolderGit2,
  GraduationCap,
  Languages as LanguagesIcon,
  MapPin,
  Sparkles,
  TrendingUp,
  Upload,
  UserRound,
  Zap,
  type LucideIcon
} from 'lucide-react'
import {
  CAREER_LEVEL_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  LANGUAGE_PROFICIENCY_LABELS,
  type ParsedResumeProfile
} from '@angkop/shared'
import { API_URL } from '@/constants/api'
import { getStoredToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ErrorMessage } from '@/components/error-message'
import { BrandLoader } from '@/components/brand-loader'
import { StepProgress } from '@/components/step-progress'

const PARSING_STEPS = ['Uploading file', 'Reading document', 'Extracting skills & experience', 'Matching to your profile']

type Stage = 'upload' | 'parsing' | 'review' | 'error'

type ParseResult = { parsed: ParsedResumeProfile; cacheHit: boolean }

async function requestParsedResume(file: File): Promise<ParseResult> {
  const token = getStoredToken()
  const formData = new FormData()
  formData.append('resume', file)

  const response = await fetch(`${API_URL}/api/resume/parse`, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
    body: formData
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error || "Couldn't read that file as a resume")
  }

  const parsed = (await response.json()) as ParsedResumeProfile
  const cacheHit = response.headers.get('X-Resume-Parse-Source') === 'cache'
  return { parsed, cacheHit }
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Reads year/month directly out of the ISO string instead of going through Date +
// toLocaleDateString — "2022-01-01" parses as UTC midnight, which a browser west of UTC
// (e.g. US Pacific) would otherwise display as "Dec 2021".
function formatMonthYear(iso: string | null): string {
  const match = iso?.match(/^(\d{4})-(\d{2})/)
  if (!match) return ''
  const monthName = MONTH_NAMES[Number(match[2]) - 1]
  return monthName ? `${monthName} ${match[1]}` : ''
}

function dateRange(start: string | null, end: string | null, current?: boolean): string {
  const startLabel = formatMonthYear(start)
  const endLabel = current ? 'Present' : formatMonthYear(end)
  if (!startLabel && !endLabel) return ''
  if (!endLabel) return startLabel
  return `${startLabel} – ${endLabel}`
}


function HighlightStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words text-foreground">{value}</p>
      </div>
    </div>
  )
}

// Long resume descriptions (experience/project bullet points, education notes) stay
// collapsed to a preview by default — everything is still there behind "View more",
// never silently dropped the way a hard truncation would.
function ExpandableText({ text, previewLength = 160 }: { text: string; previewLength?: number }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > previewLength

  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {expanded || !isLong ? text : `${text.slice(0, previewLength).trimEnd()}…`}
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="ml-1.5 cursor-pointer font-medium text-primary hover:underline"
        >
          {expanded ? 'View less' : 'View more'}
        </button>
      ) : null}
    </p>
  )
}

function SectionTrigger({ icon: Icon, label, count }: { icon: LucideIcon; label: string; count: number }) {
  return (
    <>
      <span className="flex items-center gap-2 text-foreground">
        <Icon className="size-4 text-muted-foreground" />
        {label}
      </span>
      <span className="text-xs text-muted-foreground">{count > 0 ? `${count} found` : 'None found'}</span>
    </>
  )
}

function EmptySection() {
  return <p className="text-xs text-muted-foreground">Nothing found in this resume.</p>
}

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
          {item}
        </span>
      ))}
    </div>
  )
}

export function ResumeImportDialog({
  open,
  onOpenChange,
  onImport
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (parsed: ParsedResumeProfile, fileName: string) => void
}) {
  const [stage, setStage] = useState<Stage>('upload')
  const [parsed, setParsed] = useState<ParsedResumeProfile | null>(null)
  const [isCacheHit, setIsCacheHit] = useState(false)
  const [fileName, setFileName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const lastFileRef = useRef<File | null>(null)

  useEffect(() => {
    if (!open) {
      setStage('upload')
      setParsed(null)
      setIsCacheHit(false)
      setFileName('')
      setErrorMessage('')
      lastFileRef.current = null
    }
  }, [open])

  async function runParse(file: File) {
    lastFileRef.current = file
    setFileName(file.name)
    setStage('parsing')
    try {
      const { parsed: result, cacheHit } = await requestParsedResume(file)
      setParsed(result)
      setIsCacheHit(cacheHit)
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
    onImport(parsed, fileName)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={stage === 'review' ? 'max-w-xl' : undefined}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <DialogTitle>Import from resume</DialogTitle>
          </div>
          <DialogDescription>
            Upload a resume (PDF or DOCX) and we&apos;ll read it to fill in your headline, skills, experience,
            education, certifications, projects, and languages — you&apos;ll review everything before it&apos;s applied.
          </DialogDescription>
        </DialogHeader>

        {stage === 'upload' ? (
          <label className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/5">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              <Upload className="size-5" />
            </span>
            <span className="text-sm font-medium text-foreground">Click to upload, or drag and drop</span>
            <span className="text-xs text-muted-foreground">PDF or DOCX, up to 10MB</span>
            <input type="file" accept=".pdf,.docx" className="sr-only" onChange={handleFileChange} />
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

            <div className="mt-5 border-t border-border pt-4">
              <StepProgress steps={PARSING_STEPS} />
            </div>
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
            {isCacheHit ? (
              <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground">
                <Zap className="size-3.5" />
                Matched an earlier upload — nothing new to process
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 rounded-2xl bg-muted/40 p-4 sm:grid-cols-3">
              <HighlightStat icon={UserRound} label="Headline" value={parsed.headline || 'Not found'} />
              <HighlightStat
                icon={TrendingUp}
                label="Career level"
                value={parsed.careerLevel ? CAREER_LEVEL_LABELS[parsed.careerLevel] : 'Not found'}
              />
              <HighlightStat icon={MapPin} label="Location" value={parsed.location || 'Not found'} />
            </div>

            <Accordion type="multiple" className="rounded-2xl border border-border px-4">
              <AccordionItem value="skills">
                <AccordionTrigger>
                  <SectionTrigger icon={Sparkles} label="Skills" count={parsed.skills.length} />
                </AccordionTrigger>
                <AccordionContent>
                  {parsed.skills.length > 0 ? (
                    <ChipList items={parsed.skills.map((skill) => skill.name)} />
                  ) : (
                    <EmptySection />
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="education">
                <AccordionTrigger>
                  <SectionTrigger icon={GraduationCap} label="Education" count={parsed.education.length} />
                </AccordionTrigger>
                <AccordionContent>
                  {parsed.education.length > 0 ? (
                    <div className="space-y-3">
                      {parsed.education.map((entry, index) => (
                        <div key={index}>
                          <p className="text-sm font-medium text-foreground">{entry.school}</p>
                          <p className="text-xs text-muted-foreground">
                            {[entry.degree, entry.fieldOfStudy].filter(Boolean).join(' in ')}
                            {entry.startYear || entry.endYear
                              ? ` · ${entry.startYear ?? ''}${entry.endYear ? `–${entry.endYear}` : ''}`
                              : ''}
                          </p>
                          {entry.description ? <ExpandableText text={entry.description} /> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptySection />
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="experience">
                <AccordionTrigger>
                  <SectionTrigger icon={Briefcase} label="Experience" count={parsed.experience.length} />
                </AccordionTrigger>
                <AccordionContent>
                  {parsed.experience.length > 0 ? (
                    <div className="space-y-3">
                      {parsed.experience.map((entry, index) => (
                        <div key={index}>
                          <p className="text-sm font-medium text-foreground">
                            {entry.title} @ {entry.company}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {[
                              entry.employmentType ? EMPLOYMENT_TYPE_LABELS[entry.employmentType] : null,
                              dateRange(entry.startDate, entry.endDate, entry.current)
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          {entry.description ? <ExpandableText text={entry.description} /> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptySection />
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="certifications">
                <AccordionTrigger>
                  <SectionTrigger icon={Award} label="Certifications" count={parsed.certifications.length} />
                </AccordionTrigger>
                <AccordionContent>
                  {parsed.certifications.length > 0 ? (
                    <div className="space-y-3">
                      {parsed.certifications.map((entry, index) => (
                        <div key={index}>
                          <p className="text-sm font-medium text-foreground">{entry.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {[entry.issuer, dateRange(entry.issueDate, entry.expirationDate)].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptySection />
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="projects">
                <AccordionTrigger>
                  <SectionTrigger icon={FolderGit2} label="Projects" count={parsed.projects.length} />
                </AccordionTrigger>
                <AccordionContent>
                  {parsed.projects.length > 0 ? (
                    <div className="space-y-3">
                      {parsed.projects.map((entry, index) => (
                        <div key={index}>
                          <p className="text-sm font-medium text-foreground">{entry.name}</p>
                          {entry.description ? <ExpandableText text={entry.description} /> : null}
                          {entry.technologies.length > 0 ? (
                            <div className="mt-1.5">
                              <ChipList items={entry.technologies} />
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptySection />
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="languages">
                <AccordionTrigger>
                  <SectionTrigger icon={LanguagesIcon} label="Languages" count={parsed.languages.length} />
                </AccordionTrigger>
                <AccordionContent>
                  {parsed.languages.length > 0 ? (
                    <ChipList
                      items={parsed.languages.map((entry) =>
                        entry.proficiency ? `${entry.language} (${LANGUAGE_PROFICIENCY_LABELS[entry.proficiency]})` : entry.language
                      )}
                    />
                  ) : (
                    <EmptySection />
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
