'use client'

import { useState } from 'react'
import { gql } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/page-header'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
import { getInitials } from '@/lib/utils'

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

export function ProfilePage() {
  const { data, loading, error } = useQuery<MeQueryResult>(ME_QUERY)
  const [updateProfile, { loading: isSaving }] = useMutation(UPDATE_PROFILE_MUTATION)
  const [skillsInput, setSkillsInput] = useState('')
  const [skillsText, setSkillsText] = useState('')
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

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

  return (
    <div className="max-w-xl">
      <PageHeader title="Profile" description="This is what powers your matches — keep it up to date." />

      <div className="mb-6 flex items-center gap-4 rounded-lg border border-border p-5">
        <Avatar className="size-14">
          <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
            {email ? getInitials(name, email) : ''}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">{name ?? email}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
