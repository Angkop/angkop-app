'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UPDATE_ABOUT_MUTATION } from '../queries'

export function EditAboutForm({ about }: { about: string | null | undefined }) {
  const router = useRouter()
  const [updateAbout, { loading: isSaving }] = useMutation(UPDATE_ABOUT_MUTATION)
  const [aboutInput, setAboutInput] = useState('')
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  // Deriving state from a prop during render (React's documented pattern for this),
  // rather than in an effect, so editing the field afterward isn't clobbered by
  // a refetch: https://react.dev/learn/you-might-not-need-an-effect
  const [loadedAbout, setLoadedAbout] = useState(about)
  if (about !== undefined && about !== loadedAbout) {
    setLoadedAbout(about)
    setAboutInput(about ?? '')
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSavedMessage(null)
    await updateAbout({ variables: { about: aboutInput } })
    setSavedMessage('Profile saved. New match scores will reflect this on next load.')
  }

  return (
    <>
      <h2 className="text-sm font-semibold text-foreground">Edit profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Update your about section here. Skills, education, experience, and everything else is edited through the
        onboarding flow.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="about-input">About</Label>
          <Textarea
            id="about-input"
            value={aboutInput}
            onChange={(event) => setAboutInput(event.target.value)}
            rows={5}
          />
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
    </>
  )
}
