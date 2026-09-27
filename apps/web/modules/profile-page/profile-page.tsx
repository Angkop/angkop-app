'use client'

import { useState } from 'react'
import { gql } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'

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

  if (loading) return <div className="h-48 animate-pulse rounded-lg border border-border bg-muted" />
  if (error) return <p className="text-sm text-destructive">Could not load profile: {error.message}</p>

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>{data?.me.name ?? data?.me.email}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Skills (comma-separated)</span>
            <Input value={skillsInput} onChange={(event) => setSkillsInput(event.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">About your experience</span>
            <Textarea
              value={skillsText}
              onChange={(event) => setSkillsText(event.target.value)}
              rows={5}
            />
          </label>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Profile'}
            </Button>
            {savedMessage && <p className="text-sm text-muted-foreground">{savedMessage}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
