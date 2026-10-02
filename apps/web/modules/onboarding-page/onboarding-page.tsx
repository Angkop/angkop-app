'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  GraduationCap,
  ListChecks,
  Plus,
  Sparkles,
  Target,
  Upload,
  User,
  X
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getStoredToken } from '@/lib/auth'
import type { EducationEntry, ExperienceEntry } from '@/lib/onboarding-profile'
import { cn, getInitials } from '@/lib/utils'

const ME_QUERY = gql`
  query OnboardingMe {
    me {
      email
      name
    }
  }
`

type MeQueryResult = {
  me: { email: string; name: string | null }
}

const STEPS = [
  { id: 'about', label: 'About you', icon: User },
  { id: 'skills', label: 'Skills', icon: ListChecks },
  { id: 'background', label: 'Education & experience', icon: GraduationCap },
  { id: 'preferences', label: 'Preferences', icon: Target },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'review', label: 'Review', icon: Sparkles }
] as const

const STATUS_OPTIONS = [
  { value: 'fresh-grad', label: 'Fresh graduate' },
  { value: 'recent-grad', label: 'Recent graduate (1-2 yrs)' },
  { value: 'career-shifter', label: 'Career shifter' },
  { value: 'employed', label: 'Currently employed, exploring' }
]

function ChipList({
  items,
  onAdd,
  onRemove,
  placeholder
}: {
  items: string[]
  onAdd: (value: string) => void
  onRemove: (value: string) => void
  placeholder: string
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  function commit() {
    const value = draft.trim()
    if (value && !items.includes(value)) onAdd(value)
    setDraft('')
    setAdding(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <Badge key={item} variant="secondary">
          {item}
          <button
            type="button"
            aria-label={`Remove ${item}`}
            onClick={() => onRemove(item)}
            className="cursor-pointer rounded-full p-0.5 hover:bg-foreground/10"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {adding ? (
        <Input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit()
            if (event.key === 'Escape') {
              setDraft('')
              setAdding(false)
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          className="h-7 w-32 text-xs"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
        >
          <Plus className="size-3" />
          Add
        </button>
      )}
    </div>
  )
}

function StepSection({
  title,
  description,
  children
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}

export function OnboardingPage() {
  const router = useRouter()
  const { data } = useQuery<MeQueryResult>(ME_QUERY)
  const [isChecking, setIsChecking] = useState(true)
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [education, setEducation] = useState<EducationEntry[]>([{ school: '', degree: '', period: '' }])
  const [experience, setExperience] = useState<ExperienceEntry[]>([])
  const [desiredRoles, setDesiredRoles] = useState<string[]>([])
  const [resumeFileName, setResumeFileName] = useState('')

  useEffect(() => {
    if (!getStoredToken()) {
      router.replace('/')
      return
    }
    setIsChecking(false)
  }, [router])

  if (isChecking) return null

  const email = data?.me.email ?? ''
  const name = data?.me.name ?? null
  const activeStep = STEPS[step]
  const progress = Math.round(((step + 1) / STEPS.length) * 100)

  function updateEducation(index: number, field: keyof EducationEntry, value: string) {
    setEducation((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  function addEducation() {
    setEducation((prev) => [...prev, { school: '', degree: '', period: '' }])
  }

  function removeEducation(index: number) {
    setEducation((prev) => prev.filter((_, i) => i !== index))
  }

  function updateExperience(index: number, field: keyof ExperienceEntry, value: string) {
    setExperience((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  function addExperience() {
    setExperience((prev) => [...prev, { title: '', company: '', period: '' }])
  }

  function removeExperience(index: number) {
    setExperience((prev) => prev.filter((_, i) => i !== index))
  }

  const canContinue = step !== 0 || status.length > 0

  function goNext() {
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0))
  }

  function handleFinish() {
    router.push('/dashboard')
  }

  function handleSkip() {
    router.push('/dashboard')
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[380px_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground sm:p-12 lg:flex lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '36px 36px'
          }}
        />

        <div className="relative">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary-foreground/15 text-xs font-semibold">
              A
            </span>
            Angkop
          </Link>

          <div className="mt-10">
            <p className="text-xs font-medium text-primary-foreground/70">
              Step {step + 1} of {STEPS.length}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/15">
              <div
                className="h-full rounded-full bg-primary-foreground transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <nav className="mt-8 flex flex-col gap-1">
            {STEPS.map((s, index) => {
              const Icon = s.icon
              const isActive = index === step
              const isDone = index < step
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => index <= step && setStep(index)}
                  disabled={index > step}
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed',
                    isActive && 'bg-primary-foreground/10 font-medium text-primary-foreground',
                    !isActive && isDone && 'text-primary-foreground hover:bg-primary-foreground/5',
                    !isActive && !isDone && 'text-primary-foreground/50'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]',
                      isDone && 'bg-primary-foreground text-primary',
                      isActive && !isDone && 'bg-primary-foreground/20 text-primary-foreground',
                      !isActive && !isDone && 'bg-primary-foreground/10 text-primary-foreground/50'
                    )}
                  >
                    {isDone ? <Check className="size-3" /> : index + 1}
                  </span>
                  <Icon className="size-3.5 shrink-0" />
                  {s.label}
                </button>
              )
            })}
          </nav>
        </div>

        <p className="relative text-xs text-primary-foreground/50">Angkop</p>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4 sm:px-10">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
              A
            </span>
            <span className="text-sm text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <span className="hidden text-sm font-medium text-foreground lg:inline">{activeStep.label}</span>
          <button
            type="button"
            onClick={handleSkip}
            className="cursor-pointer text-sm text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground"
          >
            Skip onboarding
          </button>
        </div>

        <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:px-10">
          {activeStep.id === 'about' ? (
            <StepSection title="About you" description="A little context so we can start narrowing down what fits.">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                    {email ? getInitials(name, email) : ''}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{name ?? email}</p>
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Where are you in your job search?</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select one" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Where are you based?</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="e.g. Muntinlupa City, Metro Manila"
                />
              </div>
            </StepSection>
          ) : null}

          {activeStep.id === 'skills' ? (
            <StepSection
              title="Skills"
              description="Add the skills, tools, and technologies you'd put on a resume. The more specific, the better your matches."
            >
              <div className="rounded-lg border border-border p-4">
                <ChipList
                  items={skills}
                  onAdd={(value) => setSkills((prev) => [...prev, value])}
                  onRemove={(value) => setSkills((prev) => prev.filter((s) => s !== value))}
                  placeholder="e.g. React"
                />
                {skills.length === 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    No skills yet — matches will lean on your resume once you upload it.
                  </p>
                ) : null}
              </div>
            </StepSection>
          ) : null}

          {activeStep.id === 'background' ? (
            <StepSection
              title="Education & experience"
              description="Fresh graduate with no work experience yet? That's completely fine — leave the experience section empty and we'll match mostly on your skills."
            >
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Education</h3>
                {education.map((item, index) => (
                  <div key={index} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-3">
                    <Input
                      value={item.school}
                      onChange={(event) => updateEducation(index, 'school', event.target.value)}
                      placeholder="School"
                    />
                    <Input
                      value={item.degree}
                      onChange={(event) => updateEducation(index, 'degree', event.target.value)}
                      placeholder="Degree"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={item.period}
                        onChange={(event) => updateEducation(index, 'period', event.target.value)}
                        placeholder="2022 – 2026"
                      />
                      {education.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove education entry"
                          onClick={() => removeEducation(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                  <Plus className="size-3.5" />
                  Add education
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Experience <span className="font-normal text-muted-foreground">(optional)</span>
                </h3>
                {experience.map((item, index) => (
                  <div key={index} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-3">
                    <Input
                      value={item.title}
                      onChange={(event) => updateExperience(index, 'title', event.target.value)}
                      placeholder="Job title"
                    />
                    <Input
                      value={item.company}
                      onChange={(event) => updateExperience(index, 'company', event.target.value)}
                      placeholder="Company"
                    />
                    <div className="flex gap-2">
                      <Input
                        value={item.period}
                        onChange={(event) => updateExperience(index, 'period', event.target.value)}
                        placeholder="Jan 2026 – Apr 2026"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove experience entry"
                        onClick={() => removeExperience(index)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addExperience}>
                  <Plus className="size-3.5" />
                  Add experience
                </Button>
              </div>
            </StepSection>
          ) : null}

          {activeStep.id === 'preferences' ? (
            <StepSection
              title="What are you looking for?"
              description="Roles you'd want to be matched with. You can change these anytime from Profile."
            >
              <div className="rounded-lg border border-border p-4">
                <ChipList
                  items={desiredRoles}
                  onAdd={(value) => setDesiredRoles((prev) => [...prev, value])}
                  onRemove={(value) => setDesiredRoles((prev) => prev.filter((r) => r !== value))}
                  placeholder="e.g. Frontend Developer"
                />
              </div>
            </StepSection>
          ) : null}

          {activeStep.id === 'resume' ? (
            <StepSection
              title="Upload your resume"
              description="Optional, but it gives the strongest starting signal for your matches — especially before you've saved or applied to anything."
            >
              {resumeFileName ? (
                <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{resumeFileName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove resume"
                    onClick={() => setResumeFileName('')}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border p-8 text-center hover:border-foreground/30 hover:bg-muted/40">
                  <Upload className="size-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Click to upload, or drag and drop</span>
                  <span className="text-xs text-muted-foreground">PDF, up to 10MB</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) setResumeFileName(file.name)
                    }}
                  />
                </label>
              )}
            </StepSection>
          ) : null}

          {activeStep.id === 'review' ? (
            <StepSection
              title="Review"
              description="Here's what we'll use to start matching you. Everything here stays editable from Profile later."
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
                    <p className="mt-1 text-sm text-foreground">{email}</p>
                  </div>
                  <Badge variant="outline" className="gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    Connected
                  </Badge>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Status &amp; location</p>
                  <p className="mt-1 text-sm text-foreground">
                    {STATUS_OPTIONS.find((o) => o.value === status)?.label || 'Not set'}
                    {location ? ` · ${location}` : ''}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Skills ({skills.length})</p>
                  <p className="mt-1 text-sm text-foreground">
                    {skills.length > 0 ? skills.join(', ') : 'None added'}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Desired roles ({desiredRoles.length})</p>
                  <p className="mt-1 text-sm text-foreground">
                    {desiredRoles.length > 0 ? desiredRoles.join(', ') : 'None added'}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Resume</p>
                  <p className="mt-1 text-sm text-foreground">{resumeFileName || 'Not uploaded'}</p>
                </div>
              </div>
            </StepSection>
          ) : null}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {step === STEPS.length - 1 ? (
              <Button type="button" onClick={handleFinish}>
                Finish setup
                <Sparkles className="size-4" />
              </Button>
            ) : (
              <Button type="button" onClick={goNext} disabled={!canContinue}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
