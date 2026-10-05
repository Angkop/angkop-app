'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { gql } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import {
  Award,
  Briefcase,
  ClipboardList,
  FileText,
  FolderGit2,
  GraduationCap,
  Languages as LanguagesIcon,
  Mail,
  MapPin,
  PencilLine,
  Sparkles
} from 'lucide-react'
import {
  CAREER_LEVEL_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  LANGUAGE_PROFICIENCY_LABELS,
  SKILL_LEVEL_LABELS,
  WORK_SETUP_LABELS,
  type ApplicationStatus,
  type CareerLevel,
  type UserProfile as SharedUserProfile
} from '@angkop/shared'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatCard } from '@/components/stat-card'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
import { getInitials } from '@/lib/utils'

const OPEN_TO_WORK_LEVELS = new Set<CareerLevel>(['STUDENT', 'ENTRY_LEVEL', 'JUNIOR'])

const ME_QUERY = gql`
  query Me {
    me {
      id
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

const UPDATE_ABOUT_MUTATION = gql`
  mutation UpdateAbout($about: String!) {
    updateAbout(about: $about) {
      about
    }
  }
`

const SAVED_JOBS_STATUS_QUERY = gql`
  query SavedJobsStatus {
    savedJobs {
      id
      status
    }
  }
`

type MeProfile = Omit<SharedUserProfile, 'id' | 'userId' | 'skillsText'>

type MeQueryResult = {
  me: {
    id: string
    email: string
    name: string | null
    profile: MeProfile | null
  }
}

type SavedJobsStatusQueryResult = {
  savedJobs: { id: number; status: ApplicationStatus }[]
}

function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatExperiencePeriod(startDate: string, endDate: string | null, current: boolean): string {
  const start = formatMonthYear(startDate)
  const end = current || !endDate ? 'Present' : formatMonthYear(endDate)
  return `${start} – ${end}`
}

function formatEducationPeriod(startYear: number | null, endYear: number | null): string {
  if (startYear && endYear) return `${startYear} – ${endYear}`
  if (startYear) return `${startYear} – Present`
  return ''
}

function formatSalaryRange(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null
  const format = (value: number) => `₱${value.toLocaleString('en-PH')}`
  if (min != null && max != null) return `${format(min)} – ${format(max)}`
  return format((min ?? max) as number)
}

function Timeline({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex flex-col">{children}</div>
}

function TimelineItem({
  icon: Icon,
  title,
  subtitle,
  period,
  description,
  isLast
}: {
  icon: typeof Briefcase
  title: string
  subtitle: string
  period: string
  description?: string | null
  isLast: boolean
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
        {isLast ? null : <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className="min-w-0 pb-5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <p className="text-xs text-muted-foreground">{period}</p>
        {description ? <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">{description}</p> : null}
      </div>
    </div>
  )
}

export function ProfilePage() {
  const router = useRouter()
  const { data, loading, error } = useQuery<MeQueryResult>(ME_QUERY)
  const { data: savedJobsData } = useQuery<SavedJobsStatusQueryResult>(SAVED_JOBS_STATUS_QUERY)
  const [updateAbout, { loading: isSaving }] = useMutation(UPDATE_ABOUT_MUTATION)
  const [aboutInput, setAboutInput] = useState('')
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const editSectionRef = useRef<HTMLDivElement>(null)

  // Deriving state from a query result during render (React's documented pattern for
  // this), rather than in an effect, so editing the field afterward isn't clobbered by
  // a refetch: https://react.dev/learn/you-might-not-need-an-effect
  const [loadedProfile, setLoadedProfile] = useState(data?.me.profile)
  if (data?.me.profile && data.me.profile !== loadedProfile) {
    setLoadedProfile(data.me.profile)
    setAboutInput(data.me.profile.about ?? '')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSavedMessage(null)
    await updateAbout({ variables: { about: aboutInput } })
    setSavedMessage('Profile saved. New match scores will reflect this on next load.')
  }

  if (loading) return <LoadingSkeleton heightClassName="h-48" />
  if (error) return <ErrorMessage>Could not load profile: {error.message}</ErrorMessage>

  const email = data?.me.email ?? ''
  const name = data?.me.name ?? null
  const profile = data?.me.profile ?? null
  const preferences = profile?.preferences ?? null
  const isOpenToWork = profile?.careerLevel ? OPEN_TO_WORK_LEVELS.has(profile.careerLevel) : false
  const jobsAppliedCount = (savedJobsData?.savedJobs ?? []).filter((saved) => saved.status !== 'PENDING').length
  const headlineLine = [profile?.headline, profile?.careerLevel ? CAREER_LEVEL_LABELS[profile.careerLevel] : null]
    .filter(Boolean)
    .join(' · ')
  const salaryRange = preferences ? formatSalaryRange(preferences.minimumSalary, preferences.maximumSalary) : null

  function scrollToEdit() {
    editSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="h-36 bg-primary sm:h-44" />
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-14 sm:-mt-16">
            <Avatar className="size-28 border-4 border-card sm:size-32">
              <AvatarFallback className="bg-primary text-3xl font-medium text-primary-foreground">
                {email ? getInitials(name, email) : ''}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{name ?? email}</h1>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit profile"
                onClick={scrollToEdit}
                className="text-muted-foreground"
              >
                <PencilLine className="size-3.5" />
              </Button>
            </div>
            {headlineLine ? <p className="mt-1 text-sm text-muted-foreground">{headlineLine}</p> : null}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile?.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {profile.location}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {email}
              </span>
            </div>

            {isOpenToWork ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  Open to work
                </Badge>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard label="Skills listed" value={profile?.skills.length ?? 0} icon={Sparkles} />
        <StatCard label="Jobs applied" value={jobsAppliedCount} icon={ClipboardList} />
        <StatCard label="Experience" value={profile?.experience.length ?? 0} icon={Briefcase} />
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">About</h2>
        <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">
          {profile?.about || 'Nothing added yet — edit your profile below to introduce yourself.'}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Experience</h2>
        {profile && profile.experience.length > 0 ? (
          <Timeline>
            {profile.experience.map((item, index) => (
              <TimelineItem
                key={index}
                icon={Briefcase}
                title={item.title || 'Untitled role'}
                subtitle={
                  [item.company, item.employmentType ? EMPLOYMENT_TYPE_LABELS[item.employmentType] : null]
                    .filter(Boolean)
                    .join(' · ') || item.company
                }
                period={formatExperiencePeriod(item.startDate, item.endDate, item.current)}
                description={item.description}
                isLast={index === profile.experience.length - 1}
              />
            ))}
          </Timeline>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No experience added yet.</p>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Education</h2>
        {profile && profile.education.length > 0 ? (
          <Timeline>
            {profile.education.map((item, index) => (
              <TimelineItem
                key={index}
                icon={GraduationCap}
                title={item.school || 'Untitled school'}
                subtitle={[item.degree, item.fieldOfStudy].filter(Boolean).join(', ')}
                period={formatEducationPeriod(item.startYear, item.endYear)}
                description={item.description}
                isLast={index === profile.education.length - 1}
              />
            ))}
          </Timeline>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No education added yet.</p>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Skills ({profile?.skills.length ?? 0})</h2>
        {profile && profile.skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.skills.map((skill) => (
              <Badge key={skill.name} variant="secondary">
                {skill.name}
                {skill.level ? ` · ${SKILL_LEVEL_LABELS[skill.level]}` : ''}
                {skill.years ? ` · ${skill.years}y` : ''}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No skills added yet — edit your profile below.</p>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">
          Certifications ({profile?.certifications.length ?? 0})
        </h2>
        {profile && profile.certifications.length > 0 ? (
          <Timeline>
            {profile.certifications.map((item, index) => (
              <TimelineItem
                key={index}
                icon={Award}
                title={item.name}
                subtitle={item.issuer}
                period={item.issueDate ? formatMonthYear(item.issueDate) : ''}
                isLast={index === profile.certifications.length - 1}
              />
            ))}
          </Timeline>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No certifications added yet.</p>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Projects ({profile?.projects.length ?? 0})</h2>
        {profile && profile.projects.length > 0 ? (
          <div className="mt-3 flex flex-col gap-4">
            {profile.projects.map((item, index) => (
              <div key={index} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <FolderGit2 className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap text-foreground">{item.description}</p>
                  {item.technologies.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.technologies.map((tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No projects added yet.</p>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Languages ({profile?.languages.length ?? 0})</h2>
        {profile && profile.languages.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.languages.map((item, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                <LanguagesIcon className="size-3" />
                {item.language}
                {item.proficiency ? ` · ${LANGUAGE_PROFICIENCY_LABELS[item.proficiency]}` : ''}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No languages added yet.</p>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Looking for</h2>
        {preferences && preferences.desiredRoles.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {preferences.desiredRoles.map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No desired roles added yet.</p>
        )}

        {preferences ? (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
            {preferences.preferredLocations.length > 0 ? (
              <span>Locations: {preferences.preferredLocations.join(', ')}</span>
            ) : null}
            {preferences.workSetup ? <span>Setup: {WORK_SETUP_LABELS[preferences.workSetup]}</span> : null}
            {salaryRange ? <span>Salary: {salaryRange}</span> : null}
            <span>Relocate: {preferences.willingToRelocate ? 'Yes' : 'No'}</span>
            <span>Remote: {preferences.willingToRemote ? 'Yes' : 'No'}</span>
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-foreground">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          {profile?.resumeFileName || 'No resume uploaded'}
        </div>
      </div>

      <div ref={editSectionRef} className="mt-4 scroll-mt-6 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Edit profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your about section here. Skills, education, experience, and everything else is edited through the
          onboarding flow.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="about-input">About</Label>
            <Textarea id="about-input" value={aboutInput} onChange={(event) => setAboutInput(event.target.value)} rows={5} />
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Profile'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/onboarding')}>
              Edit full profile
            </Button>
            {savedMessage && <p className="text-sm text-muted-foreground">{savedMessage}</p>}
          </div>
        </form>
      </div>
    </div>
  )
}
