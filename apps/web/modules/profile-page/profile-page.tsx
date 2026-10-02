'use client'

import { useRef, useState } from 'react'
import { gql } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import { Briefcase, FileText, GraduationCap, Mail, MapPin, PencilLine, Sparkles } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatCard } from '@/components/stat-card'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
import type { OnboardingProfile } from '@/lib/onboarding-profile'
import { getInitials } from '@/lib/utils'

const STATUS_LABELS: Record<string, string> = {
  'fresh-grad': 'Fresh graduate',
  'recent-grad': 'Recent graduate (1-2 yrs)',
  'career-shifter': 'Career shifter',
  employed: 'Currently employed, exploring'
}

const OPEN_TO_WORK_STATUSES = new Set(['fresh-grad', 'recent-grad', 'career-shifter'])

// Mock data standing in for onboarding's answers until there's a real backend
// field to read them from — see onboarding-page.tsx, which doesn't persist these yet.
const MOCK_ONBOARDING_PROFILE: OnboardingProfile = {
  status: 'fresh-grad',
  location: 'Muntinlupa City, Metro Manila',
  skills: ['React', 'TypeScript', 'Node.js', 'Figma'],
  education: [
    {
      school: 'Lyceum of Alabang',
      degree: "Bachelor's degree, Computer Science",
      period: '2022 – 2026',
      skills: ['Object-Oriented Programming', 'Data Structures', 'Git']
    }
  ],
  experience: [
    {
      title: 'Frontend Intern',
      company: 'Acme Labs',
      period: 'Jun 2025 – Aug 2025',
      skills: ['React', 'TypeScript', 'Tailwind CSS']
    }
  ],
  desiredRoles: ['Frontend Developer', 'Product Designer'],
  resumeFileName: 'resume-2026.pdf'
}

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      profile {
        skills
        skillsText
      }
    }
  }
`

const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      skills
      skillsText
    }
  }
`

type MeQueryResult = {
  me: {
    id: string
    email: string
    name: string | null
    profile: { skills: string[]; skillsText: string } | null
  }
}

function Timeline({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex flex-col">{children}</div>
}

function TimelineItem({
  icon: Icon,
  title,
  subtitle,
  period,
  skills,
  isLast
}: {
  icon: typeof Briefcase
  title: string
  subtitle: string
  period: string
  skills?: string[]
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
        {skills && skills.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { data, loading, error } = useQuery<MeQueryResult>(ME_QUERY)
  const [updateProfile, { loading: isSaving }] = useMutation(UPDATE_PROFILE_MUTATION)
  const [skillsInput, setSkillsInput] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const editSectionRef = useRef<HTMLDivElement>(null)
  const onboarding = MOCK_ONBOARDING_PROFILE

  // Deriving state from a query result during render (React's documented pattern for
  // this), rather than in an effect, so editing the fields afterward isn't clobbered by
  // a refetch: https://react.dev/learn/you-might-not-need-an-effect
  const [loadedProfile, setLoadedProfile] = useState(data?.me.profile)
  if (data?.me.profile && data.me.profile !== loadedProfile) {
    setLoadedProfile(data.me.profile)
    setSkillsInput(data.me.profile.skills.join(', '))
    setSkillsText(data.me.profile.skillsText)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSavedMessage(null)
    const skills = skillsInput
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean)
    await updateProfile({ variables: { input: { skills, skillsText } } })
    setSavedMessage('Profile saved. New match scores will reflect this on next load.')
  }

  if (loading) return <LoadingSkeleton heightClassName="h-48" />
  if (error) return <ErrorMessage>Could not load profile: {error.message}</ErrorMessage>

  const email = data?.me.email ?? ''
  const name = data?.me.name ?? null
  const skills = skillsInput
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)
  const headline = [onboarding.desiredRoles[0], STATUS_LABELS[onboarding.status]].filter(Boolean).join(' · ')
  const isOpenToWork = OPEN_TO_WORK_STATUSES.has(onboarding.status)

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
            {headline ? <p className="mt-1 text-sm text-muted-foreground">{headline}</p> : null}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {onboarding.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {onboarding.location}
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
        <StatCard label="Skills listed" value={skills.length} icon={Sparkles} />
        <StatCard label="Education" value={onboarding.education.length} icon={GraduationCap} />
        <StatCard label="Experience" value={onboarding.experience.length} icon={Briefcase} />
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">About</h2>
        <p className="mt-2 text-sm whitespace-pre-wrap text-foreground">
          {skillsText || 'Nothing added yet — edit your profile below to introduce yourself.'}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Experience</h2>
        {onboarding.experience.length > 0 ? (
          <Timeline>
            {onboarding.experience.map((item, index) => (
              <TimelineItem
                key={index}
                icon={Briefcase}
                title={item.title || 'Untitled role'}
                subtitle={item.company}
                period={item.period}
                skills={item.skills}
                isLast={index === onboarding.experience.length - 1}
              />
            ))}
          </Timeline>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No experience added yet.</p>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Education</h2>
        {onboarding.education.length > 0 ? (
          <Timeline>
            {onboarding.education.map((item, index) => (
              <TimelineItem
                key={index}
                icon={GraduationCap}
                title={item.school || 'Untitled school'}
                subtitle={item.degree}
                period={item.period}
                skills={item.skills}
                isLast={index === onboarding.education.length - 1}
              />
            ))}
          </Timeline>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No education added yet.</p>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Skills ({skills.length})</h2>
        {skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No skills added yet — edit your profile below.</p>
        )}
      </div>

      <div className="mt-4 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Looking for</h2>
        {onboarding.desiredRoles.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {onboarding.desiredRoles.map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No desired roles added yet.</p>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-foreground">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          {onboarding.resumeFileName || 'No resume uploaded'}
        </div>
      </div>

      <div ref={editSectionRef} className="mt-4 scroll-mt-6 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Edit profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">This is what powers your matches — keep it up to date.</p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Input id="skills" value={skillsInput} onChange={(event) => setSkillsInput(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="skills-text">About your experience</Label>
            <Textarea
              id="skills-text"
              value={skillsText}
              onChange={(event) => setSkillsText(event.target.value)}
              rows={5}
            />
          </div>
          <div className="flex items-center gap-3 border-t border-border pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Profile'}
            </Button>
            {savedMessage && <p className="text-sm text-muted-foreground">{savedMessage}</p>}
          </div>
        </form>
      </div>
    </div>
  )
}
