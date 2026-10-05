'use client'

import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { gql } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Check,
  FileText,
  FolderGit2,
  GraduationCap,
  Languages as LanguagesIcon,
  ListChecks,
  Plus,
  Sparkles,
  Target,
  Upload,
  User,
  X
} from 'lucide-react'
import {
  CAREER_LEVEL_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  LANGUAGE_PROFICIENCY_LABELS,
  SKILL_LEVEL_LABELS,
  WORK_SETUP_LABELS,
  type CareerLevel,
  type EmploymentType,
  type LanguageProficiency,
  type SkillLevel,
  type UserProfile as SharedUserProfile,
  type WorkSetup
} from '@angkop/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChipList } from '@/components/chip-list'
import { ErrorMessage } from '@/components/error-message'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageLoader } from '@/components/page-loader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabaseClient } from '@/lib/supabase-client'
import type {
  CertificationEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  PreferencesEntry,
  ProfileSkillEntry,
  ProjectEntry
} from '@/lib/onboarding-profile'
import { cn, getInitials } from '@/lib/utils'

const ME_QUERY = gql`
  query OnboardingMe {
    me {
      email
      name
      profile {
        headline
        about
        careerLevel
        location
        resumeFileName
        skills {
          name
          category
          level
          years
        }
        education {
          school
          degree
          fieldOfStudy
          startYear
          endYear
          description
        }
        experience {
          title
          company
          location
          employmentType
          description
          startDate
          endDate
          current
        }
        certifications {
          name
          issuer
          issueDate
          expirationDate
          credentialId
          credentialUrl
        }
        projects {
          name
          description
          technologies
          url
          startDate
          endDate
        }
        languages {
          language
          proficiency
        }
        preferences {
          desiredRoles
          preferredLocations
          preferredJobTypes
          preferredIndustries
          workSetup
          minimumSalary
          maximumSalary
          willingToRelocate
          willingToRemote
        }
      }
    }
  }
`

const COMPLETE_ONBOARDING_MUTATION = gql`
  mutation CompleteOnboarding($input: CompleteOnboardingInput!) {
    completeOnboarding(input: $input) {
      id
    }
  }
`

type MeProfile = Omit<SharedUserProfile, 'id' | 'userId' | 'skillsText'>

type MeQueryResult = {
  me: { email: string; name: string | null; profile: MeProfile | null }
}

const STEPS = [
  { id: 'about', label: 'About you', icon: User },
  { id: 'skills', label: 'Skills', icon: ListChecks },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'languages', label: 'Languages', icon: LanguagesIcon },
  { id: 'preferences', label: 'Preferences', icon: Target },
  { id: 'resume', label: 'Resume', icon: FileText },
  { id: 'review', label: 'Review', icon: Sparkles }
] as const

const EMPTY_EDUCATION: EducationEntry = {
  school: '',
  degree: '',
  fieldOfStudy: '',
  startYear: '',
  endYear: '',
  description: ''
}

const EMPTY_EXPERIENCE: ExperienceEntry = {
  title: '',
  company: '',
  location: '',
  employmentType: undefined,
  description: '',
  startDate: '',
  endDate: '',
  current: false
}

const EMPTY_CERTIFICATION: CertificationEntry = {
  name: '',
  issuer: '',
  issueDate: '',
  expirationDate: '',
  credentialId: '',
  credentialUrl: ''
}

const EMPTY_PROJECT: ProjectEntry = {
  name: '',
  description: '',
  technologies: [],
  url: '',
  startDate: '',
  endDate: ''
}

const EMPTY_LANGUAGE: LanguageEntry = { language: '', proficiency: undefined }

const EMPTY_PREFERENCES: PreferencesEntry = {
  desiredRoles: [],
  preferredLocations: [],
  preferredJobTypes: [],
  preferredIndustries: [],
  workSetup: undefined,
  minimumSalary: '',
  maximumSalary: '',
  willingToRelocate: false,
  willingToRemote: true
}

function monthInputFromIso(iso: string | null): string {
  return iso ? iso.slice(0, 7) : ''
}

function isoFromMonthInput(month: string): string | null {
  return month ? `${month}-01` : null
}

function makeArrayHelpers<T>(setState: Dispatch<SetStateAction<T[]>>, empty: T) {
  return {
    update: <K extends keyof T>(index: number, field: K, value: T[K]) =>
      setState((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))),
    add: () => setState((prev) => [...prev, empty]),
    remove: (index: number) => setState((prev) => prev.filter((_, i) => i !== index))
  }
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

function ToggleChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
      )}
    >
      {label}
    </button>
  )
}

export function OnboardingPage() {
  const router = useRouter()
  const { data } = useQuery<MeQueryResult>(ME_QUERY)
  const [completeOnboarding, { loading: isSaving, error: saveError }] = useMutation(COMPLETE_ONBOARDING_MUTATION)
  const [isChecking, setIsChecking] = useState(true)
  const [step, setStep] = useState(0)

  const [headline, setHeadline] = useState('')
  const [about, setAbout] = useState('')
  const [careerLevel, setCareerLevel] = useState<CareerLevel | ''>('')
  const [location, setLocation] = useState('')
  const [skills, setSkills] = useState<ProfileSkillEntry[]>([])
  const [education, setEducation] = useState<EducationEntry[]>([EMPTY_EDUCATION])
  const [experience, setExperience] = useState<ExperienceEntry[]>([])
  const [certifications, setCertifications] = useState<CertificationEntry[]>([])
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [languages, setLanguages] = useState<LanguageEntry[]>([])
  const [preferences, setPreferences] = useState<PreferencesEntry>(EMPTY_PREFERENCES)
  const [resumeFileName, setResumeFileName] = useState('')

  const [loadedProfile, setLoadedProfile] = useState<MeProfile | null | undefined>(undefined)

  useEffect(() => {
    let isMounted = true

    // Right after the Google redirect lands here, Supabase is still parsing the auth
    // tokens out of the URL — getSession() awaits that before resolving, so this won't
    // bounce the user back to "/" while the session is still being established.
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      if (!session) {
        router.replace('/')
        return
      }
      setIsChecking(false)
    })

    return () => {
      isMounted = false
    }
  }, [router])

  // Deriving wizard state from the query result during render (React's documented
  // pattern for this — see profile-page.tsx), so the wizard prefills from whatever was
  // saved before, and re-entering it later doubles as "edit my profile."
  if (data?.me.profile && data.me.profile !== loadedProfile) {
    const profile = data.me.profile
    setLoadedProfile(profile)
    setHeadline(profile.headline ?? '')
    setAbout(profile.about ?? '')
    setCareerLevel(profile.careerLevel ?? '')
    setLocation(profile.location ?? '')
    setResumeFileName(profile.resumeFileName ?? '')
    setSkills(
      profile.skills.map((skill) => ({
        name: skill.name,
        category: skill.category ?? undefined,
        level: skill.level ?? undefined,
        years: skill.years ?? undefined
      }))
    )
    setEducation(
      profile.education.length > 0
        ? profile.education.map((entry) => ({
            school: entry.school,
            degree: entry.degree ?? '',
            fieldOfStudy: entry.fieldOfStudy ?? '',
            startYear: entry.startYear ? String(entry.startYear) : '',
            endYear: entry.endYear ? String(entry.endYear) : '',
            description: entry.description ?? ''
          }))
        : [EMPTY_EDUCATION]
    )
    setExperience(
      profile.experience.map((entry) => ({
        title: entry.title,
        company: entry.company,
        location: entry.location ?? '',
        employmentType: entry.employmentType ?? undefined,
        description: entry.description ?? '',
        startDate: monthInputFromIso(entry.startDate),
        endDate: monthInputFromIso(entry.endDate),
        current: entry.current
      }))
    )
    setCertifications(
      profile.certifications.map((entry) => ({
        name: entry.name,
        issuer: entry.issuer,
        issueDate: monthInputFromIso(entry.issueDate),
        expirationDate: monthInputFromIso(entry.expirationDate),
        credentialId: entry.credentialId ?? '',
        credentialUrl: entry.credentialUrl ?? ''
      }))
    )
    setProjects(
      profile.projects.map((entry) => ({
        name: entry.name,
        description: entry.description,
        technologies: entry.technologies,
        url: entry.url ?? '',
        startDate: monthInputFromIso(entry.startDate),
        endDate: monthInputFromIso(entry.endDate)
      }))
    )
    setLanguages(
      profile.languages.map((entry) => ({ language: entry.language, proficiency: entry.proficiency ?? undefined }))
    )
    if (profile.preferences) {
      setPreferences({
        desiredRoles: profile.preferences.desiredRoles,
        preferredLocations: profile.preferences.preferredLocations,
        preferredJobTypes: profile.preferences.preferredJobTypes,
        preferredIndustries: profile.preferences.preferredIndustries,
        workSetup: profile.preferences.workSetup ?? undefined,
        minimumSalary: profile.preferences.minimumSalary != null ? String(profile.preferences.minimumSalary) : '',
        maximumSalary: profile.preferences.maximumSalary != null ? String(profile.preferences.maximumSalary) : '',
        willingToRelocate: profile.preferences.willingToRelocate,
        willingToRemote: profile.preferences.willingToRemote
      })
    }
  }

  if (isChecking) return <PageLoader label="Setting up your account…" />

  const email = data?.me.email ?? ''
  const name = data?.me.name ?? null
  const activeStep = STEPS[step]
  const progress = Math.round(((step + 1) / STEPS.length) * 100)
  const canContinue = step !== 0 || careerLevel !== ''

  const educationHelpers = makeArrayHelpers(setEducation, EMPTY_EDUCATION)
  const experienceHelpers = makeArrayHelpers(setExperience, EMPTY_EXPERIENCE)
  const certificationHelpers = makeArrayHelpers(setCertifications, EMPTY_CERTIFICATION)
  const projectHelpers = makeArrayHelpers(setProjects, EMPTY_PROJECT)
  const languageHelpers = makeArrayHelpers(setLanguages, EMPTY_LANGUAGE)

  function goNext() {
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0))
  }

  async function handleFinish() {
    await completeOnboarding({
      variables: {
        input: {
          headline: headline || null,
          about: about || null,
          location: location || null,
          careerLevel: careerLevel || null,
          resumeFileName: resumeFileName || null,
          skills: skills
            .filter((skill) => skill.name.trim().length > 0)
            .map((skill) => ({
              name: skill.name,
              category: skill.category || null,
              level: skill.level ?? null,
              years: skill.years ?? null
            })),
          education: education
            .filter((entry) => entry.school.trim().length > 0)
            .map((entry) => ({
              school: entry.school,
              degree: entry.degree || null,
              fieldOfStudy: entry.fieldOfStudy || null,
              startYear: entry.startYear ? Number(entry.startYear) : null,
              endYear: entry.endYear ? Number(entry.endYear) : null,
              description: entry.description || null
            })),
          experience: experience
            .filter((entry) => entry.title.trim().length > 0 && entry.company.trim().length > 0 && entry.startDate)
            .map((entry) => ({
              title: entry.title,
              company: entry.company,
              location: entry.location || null,
              employmentType: entry.employmentType ?? null,
              description: entry.description || null,
              startDate: isoFromMonthInput(entry.startDate)!,
              endDate: entry.current ? null : isoFromMonthInput(entry.endDate),
              current: entry.current
            })),
          certifications: certifications
            .filter((entry) => entry.name.trim().length > 0 && entry.issuer.trim().length > 0)
            .map((entry) => ({
              name: entry.name,
              issuer: entry.issuer,
              issueDate: isoFromMonthInput(entry.issueDate),
              expirationDate: isoFromMonthInput(entry.expirationDate),
              credentialId: entry.credentialId || null,
              credentialUrl: entry.credentialUrl || null
            })),
          projects: projects
            .filter((entry) => entry.name.trim().length > 0 && entry.description.trim().length > 0)
            .map((entry) => ({
              name: entry.name,
              description: entry.description,
              technologies: entry.technologies,
              url: entry.url || null,
              startDate: isoFromMonthInput(entry.startDate),
              endDate: isoFromMonthInput(entry.endDate)
            })),
          languages: languages
            .filter((entry) => entry.language.trim().length > 0)
            .map((entry) => ({ language: entry.language, proficiency: entry.proficiency ?? null })),
          preferences: {
            desiredRoles: preferences.desiredRoles,
            preferredLocations: preferences.preferredLocations,
            preferredJobTypes: preferences.preferredJobTypes,
            preferredIndustries: preferences.preferredIndustries,
            workSetup: preferences.workSetup ?? null,
            minimumSalary: preferences.minimumSalary ? Number(preferences.minimumSalary) : null,
            maximumSalary: preferences.maximumSalary ? Number(preferences.maximumSalary) : null,
            willingToRelocate: preferences.willingToRelocate,
            willingToRemote: preferences.willingToRemote
          }
        }
      }
    })
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
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  placeholder="e.g. Front-End Developer"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="career-level">Where are you in your career?</Label>
                <Select value={careerLevel} onValueChange={(value) => setCareerLevel(value as CareerLevel)}>
                  <SelectTrigger id="career-level" className="w-full">
                    <SelectValue placeholder="Select one" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CAREER_LEVEL_LABELS) as [CareerLevel, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
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

              <div className="space-y-1.5">
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  value={about}
                  onChange={(event) => setAbout(event.target.value)}
                  rows={4}
                  placeholder="A short introduction — what you do and what you're looking for."
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
                  items={skills.map((skill) => skill.name)}
                  onAdd={(value) => setSkills((prev) => [...prev, { name: value }])}
                  onRemove={(value) => setSkills((prev) => prev.filter((skill) => skill.name !== value))}
                  placeholder="e.g. React"
                />
                {skills.length === 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    No skills yet — matches will lean on your resume once you upload it.
                  </p>
                ) : null}
              </div>

              {skills.length > 0 ? (
                <div className="space-y-2">
                  {skills.map((skill, index) => (
                    <div
                      key={skill.name}
                      className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center"
                    >
                      <span className="flex-1 truncate text-sm font-medium text-foreground">{skill.name}</span>
                      <Select
                        value={skill.level ?? ''}
                        onValueChange={(value) =>
                          setSkills((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, level: value as SkillLevel } : item))
                          )
                        }
                      >
                        <SelectTrigger className="w-full sm:w-36">
                          <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(SKILL_LEVEL_LABELS) as [SkillLevel, string][]).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={skill.years ?? ''}
                        onChange={(event) =>
                          setSkills((prev) =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, years: event.target.value ? Number(event.target.value) : undefined }
                                : item
                            )
                          )
                        }
                        placeholder="Years"
                        className="w-full sm:w-20"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </StepSection>
          ) : null}

          {activeStep.id === 'education' ? (
            <StepSection
              title="Education"
              description="Fresh graduate with no work experience yet? That's completely fine — the Experience step is optional."
            >
              <div className="space-y-3">
                {education.map((item, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={item.school}
                        onChange={(event) => educationHelpers.update(index, 'school', event.target.value)}
                        placeholder="School"
                      />
                      <Input
                        value={item.degree}
                        onChange={(event) => educationHelpers.update(index, 'degree', event.target.value)}
                        placeholder="Degree (e.g. Bachelor of Science)"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Input
                        value={item.fieldOfStudy}
                        onChange={(event) => educationHelpers.update(index, 'fieldOfStudy', event.target.value)}
                        placeholder="Field of study (e.g. Computer Science)"
                        className="sm:col-span-1"
                      />
                      <Input
                        type="number"
                        value={item.startYear}
                        onChange={(event) => educationHelpers.update(index, 'startYear', event.target.value)}
                        placeholder="Start year"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={item.endYear}
                          onChange={(event) => educationHelpers.update(index, 'endYear', event.target.value)}
                          placeholder="End year"
                        />
                        {education.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Remove education entry"
                            onClick={() => educationHelpers.remove(index)}
                          >
                            <X className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <Textarea
                      value={item.description}
                      onChange={(event) => educationHelpers.update(index, 'description', event.target.value)}
                      placeholder="Relevant coursework, honors, activities (optional)"
                      rows={2}
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={educationHelpers.add}>
                  <Plus className="size-3.5" />
                  Add education
                </Button>
              </div>
            </StepSection>
          ) : null}

          {activeStep.id === 'experience' ? (
            <StepSection
              title="Work experience"
              description="Internships count. Leave this empty if you don't have any yet — we'll match mostly on your skills and projects."
            >
              <div className="space-y-3">
                {experience.map((item, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={item.title}
                        onChange={(event) => experienceHelpers.update(index, 'title', event.target.value)}
                        placeholder="Job title"
                      />
                      <Input
                        value={item.company}
                        onChange={(event) => experienceHelpers.update(index, 'company', event.target.value)}
                        placeholder="Company"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={item.location}
                        onChange={(event) => experienceHelpers.update(index, 'location', event.target.value)}
                        placeholder="Location (optional)"
                      />
                      <Select
                        value={item.employmentType ?? ''}
                        onValueChange={(value) =>
                          experienceHelpers.update(index, 'employmentType', value as EmploymentType)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Employment type" />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid items-center gap-2 sm:grid-cols-3">
                      <Input
                        type="month"
                        value={item.startDate}
                        onChange={(event) => experienceHelpers.update(index, 'startDate', event.target.value)}
                      />
                      <Input
                        type="month"
                        value={item.endDate}
                        onChange={(event) => experienceHelpers.update(index, 'endDate', event.target.value)}
                        disabled={item.current}
                        placeholder="End date"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="checkbox"
                            checked={item.current}
                            onChange={(event) => experienceHelpers.update(index, 'current', event.target.checked)}
                            className="size-4 rounded border-input accent-primary"
                          />
                          Current
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove experience entry"
                          onClick={() => experienceHelpers.remove(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={item.description}
                      onChange={(event) => experienceHelpers.update(index, 'description', event.target.value)}
                      placeholder="What did you work on? (optional, but helps your matches)"
                      rows={2}
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={experienceHelpers.add}>
                  <Plus className="size-3.5" />
                  Add experience
                </Button>
              </div>
            </StepSection>
          ) : null}

          {activeStep.id === 'certifications' ? (
            <StepSection
              title="Certifications"
              description="Online courses, bootcamps, and professional certifications all count."
            >
              <div className="space-y-3">
                {certifications.map((item, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={item.name}
                        onChange={(event) => certificationHelpers.update(index, 'name', event.target.value)}
                        placeholder="Certification name"
                      />
                      <Input
                        value={item.issuer}
                        onChange={(event) => certificationHelpers.update(index, 'issuer', event.target.value)}
                        placeholder="Issuer (e.g. Amazon Web Services)"
                      />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Input
                        type="month"
                        value={item.issueDate}
                        onChange={(event) => certificationHelpers.update(index, 'issueDate', event.target.value)}
                        placeholder="Issue date"
                      />
                      <Input
                        type="month"
                        value={item.expirationDate}
                        onChange={(event) =>
                          certificationHelpers.update(index, 'expirationDate', event.target.value)
                        }
                        placeholder="Expiration (optional)"
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove certification"
                          onClick={() => certificationHelpers.remove(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={item.credentialId}
                        onChange={(event) => certificationHelpers.update(index, 'credentialId', event.target.value)}
                        placeholder="Credential ID (optional)"
                      />
                      <Input
                        value={item.credentialUrl}
                        onChange={(event) =>
                          certificationHelpers.update(index, 'credentialUrl', event.target.value)
                        }
                        placeholder="Credential URL (optional)"
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={certificationHelpers.add}>
                  <Plus className="size-3.5" />
                  Add certification
                </Button>
              </div>
            </StepSection>
          ) : null}

          {activeStep.id === 'projects' ? (
            <StepSection
              title="Projects"
              description="Especially useful if you don't have much work experience yet — show what you've actually built."
            >
              <div className="space-y-3">
                {projects.map((item, index) => (
                  <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.name}
                        onChange={(event) => projectHelpers.update(index, 'name', event.target.value)}
                        placeholder="Project name"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove project"
                        onClick={() => projectHelpers.remove(index)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={item.description}
                      onChange={(event) => projectHelpers.update(index, 'description', event.target.value)}
                      placeholder="What does it do, and what did you build?"
                      rows={2}
                    />
                    <ChipList
                      items={item.technologies}
                      onAdd={(value) => projectHelpers.update(index, 'technologies', [...item.technologies, value])}
                      onRemove={(value) =>
                        projectHelpers.update(
                          index,
                          'technologies',
                          item.technologies.filter((tech) => tech !== value)
                        )
                      }
                      placeholder="e.g. Next.js"
                    />
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Input
                        value={item.url}
                        onChange={(event) => projectHelpers.update(index, 'url', event.target.value)}
                        placeholder="Link (optional)"
                        className="sm:col-span-1"
                      />
                      <Input
                        type="month"
                        value={item.startDate}
                        onChange={(event) => projectHelpers.update(index, 'startDate', event.target.value)}
                      />
                      <Input
                        type="month"
                        value={item.endDate}
                        onChange={(event) => projectHelpers.update(index, 'endDate', event.target.value)}
                        placeholder="End date (optional)"
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={projectHelpers.add}>
                  <Plus className="size-3.5" />
                  Add project
                </Button>
              </div>
            </StepSection>
          ) : null}

          {activeStep.id === 'languages' ? (
            <StepSection title="Languages" description="Some roles care which languages you speak and how well.">
              <div className="space-y-3">
                {languages.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 rounded-lg border border-border p-3">
                    <Input
                      value={item.language}
                      onChange={(event) => languageHelpers.update(index, 'language', event.target.value)}
                      placeholder="e.g. English"
                      className="flex-1"
                    />
                    <Select
                      value={item.proficiency ?? ''}
                      onValueChange={(value) =>
                        languageHelpers.update(index, 'proficiency', value as LanguageProficiency)
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Proficiency" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(LANGUAGE_PROFICIENCY_LABELS) as [LanguageProficiency, string][]).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove language"
                      onClick={() => languageHelpers.remove(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={languageHelpers.add}>
                  <Plus className="size-3.5" />
                  Add language
                </Button>
              </div>
            </StepSection>
          ) : null}

          {activeStep.id === 'preferences' ? (
            <StepSection
              title="What are you looking for?"
              description="This keeps your matches from scoring high on skills alone when the location or setup doesn't fit."
            >
              <div className="space-y-1.5">
                <Label>Desired roles</Label>
                <div className="rounded-lg border border-border p-4">
                  <ChipList
                    items={preferences.desiredRoles}
                    onAdd={(value) =>
                      setPreferences((prev) => ({ ...prev, desiredRoles: [...prev.desiredRoles, value] }))
                    }
                    onRemove={(value) =>
                      setPreferences((prev) => ({
                        ...prev,
                        desiredRoles: prev.desiredRoles.filter((role) => role !== value)
                      }))
                    }
                    placeholder="e.g. Frontend Developer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Preferred locations</Label>
                <div className="rounded-lg border border-border p-4">
                  <ChipList
                    items={preferences.preferredLocations}
                    onAdd={(value) =>
                      setPreferences((prev) => ({
                        ...prev,
                        preferredLocations: [...prev.preferredLocations, value]
                      }))
                    }
                    onRemove={(value) =>
                      setPreferences((prev) => ({
                        ...prev,
                        preferredLocations: prev.preferredLocations.filter((loc) => loc !== value)
                      }))
                    }
                    placeholder="e.g. Metro Manila"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Job types</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(([value, label]) => (
                    <ToggleChip
                      key={value}
                      label={label}
                      selected={preferences.preferredJobTypes.includes(value)}
                      onToggle={() =>
                        setPreferences((prev) => ({
                          ...prev,
                          preferredJobTypes: prev.preferredJobTypes.includes(value)
                            ? prev.preferredJobTypes.filter((type) => type !== value)
                            : [...prev.preferredJobTypes, value]
                        }))
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Preferred industries</Label>
                <div className="rounded-lg border border-border p-4">
                  <ChipList
                    items={preferences.preferredIndustries}
                    onAdd={(value) =>
                      setPreferences((prev) => ({
                        ...prev,
                        preferredIndustries: [...prev.preferredIndustries, value]
                      }))
                    }
                    onRemove={(value) =>
                      setPreferences((prev) => ({
                        ...prev,
                        preferredIndustries: prev.preferredIndustries.filter((industry) => industry !== value)
                      }))
                    }
                    placeholder="e.g. Fintech"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="work-setup">Work setup</Label>
                  <Select
                    value={preferences.workSetup ?? ''}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({ ...prev, workSetup: value as WorkSetup }))
                    }
                  >
                    <SelectTrigger id="work-setup" className="w-full">
                      <SelectValue placeholder="Select one" />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(WORK_SETUP_LABELS) as [WorkSetup, string][]).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="min-salary">Min. salary (₱)</Label>
                    <Input
                      id="min-salary"
                      type="number"
                      min="0"
                      value={preferences.minimumSalary}
                      onChange={(event) =>
                        setPreferences((prev) => ({ ...prev, minimumSalary: event.target.value }))
                      }
                      placeholder="25000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="max-salary">Max. salary (₱)</Label>
                    <Input
                      id="max-salary"
                      type="number"
                      min="0"
                      value={preferences.maximumSalary}
                      onChange={(event) =>
                        setPreferences((prev) => ({ ...prev, maximumSalary: event.target.value }))
                      }
                      placeholder="45000"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="willing-to-relocate">Willing to relocate?</Label>
                  <Select
                    value={preferences.willingToRelocate ? 'yes' : 'no'}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({ ...prev, willingToRelocate: value === 'yes' }))
                    }
                  >
                    <SelectTrigger id="willing-to-relocate" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="willing-to-remote">Open to remote?</Label>
                  <Select
                    value={preferences.willingToRemote ? 'yes' : 'no'}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({ ...prev, willingToRemote: value === 'yes' }))
                    }
                  >
                    <SelectTrigger id="willing-to-remote" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                    <Sparkles className="size-3.5 text-primary" />
                    Connected
                  </Badge>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Headline &amp; career level</p>
                  <p className="mt-1 text-sm text-foreground">
                    {headline || 'Not set'}
                    {careerLevel ? ` · ${CAREER_LEVEL_LABELS[careerLevel]}` : ''}
                    {location ? ` · ${location}` : ''}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Skills ({skills.length})</p>
                  <p className="mt-1 text-sm text-foreground">
                    {skills.length > 0 ? skills.map((skill) => skill.name).join(', ') : 'None added'}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Education ({education.filter((e) => e.school).length})</p>
                  <p className="mt-1 text-sm text-foreground">
                    {education.filter((e) => e.school).length > 0
                      ? education
                          .filter((e) => e.school)
                          .map((e) => e.school)
                          .join(', ')
                      : 'None added'}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Experience ({experience.length})</p>
                  <p className="mt-1 text-sm text-foreground">
                    {experience.length > 0
                      ? experience.map((e) => `${e.title} at ${e.company}`).join(', ')
                      : 'None added'}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Certifications ({certifications.length})</p>
                  <p className="mt-1 text-sm text-foreground">
                    {certifications.length > 0 ? certifications.map((c) => c.name).join(', ') : 'None added'}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Projects ({projects.length})</p>
                  <p className="mt-1 text-sm text-foreground">
                    {projects.length > 0 ? projects.map((p) => p.name).join(', ') : 'None added'}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Desired roles ({preferences.desiredRoles.length})</p>
                  <p className="mt-1 text-sm text-foreground">
                    {preferences.desiredRoles.length > 0 ? preferences.desiredRoles.join(', ') : 'None added'}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Resume</p>
                  <p className="mt-1 text-sm text-foreground">{resumeFileName || 'Not uploaded'}</p>
                </div>
              </div>
              {saveError ? <ErrorMessage>Could not save your profile: {saveError.message}</ErrorMessage> : null}
            </StepSection>
          ) : null}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={goBack} disabled={step === 0}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            {step === STEPS.length - 1 ? (
              <Button type="button" onClick={handleFinish} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Finish setup'}
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
