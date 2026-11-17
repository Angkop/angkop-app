import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWatch, type FieldErrors } from 'react-hook-form'
import { toast } from 'sonner'
import { supabaseClient } from '@/lib/supabase-client'
import { useProfileEditor } from '@/hooks/use-profile-editor'
import type { ProfileFormValues } from '@/lib/profile-form'
import { STEPS, STEP_FIELDS } from '../constants'

export function useOnboardingWizard() {
  const router = useRouter()
  const profileEditor = useProfileEditor({ requireCareerLevel: true })
  const { form } = profileEditor
  const [isChecking, setIsChecking] = useState(true)
  const [step, setStep] = useState(0)

  useEffect(() => {
    let isMounted = true

    // Right after the Google redirect lands here, Supabase is still parsing the auth
    // tokens out of the URL — getSession() awaits that before resolving, so this won't
    // bounce the user back to "/" while the session is still being established.
    supabaseClient.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return
        if (!session) {
          router.replace('/')
          return
        }
        setIsChecking(false)
      })
      .catch(() => {
        if (isMounted) router.replace('/')
      })

    return () => {
      isMounted = false
    }
  }, [router])

  const resumeFileName = useWatch({ control: form.control, name: 'resumeFileName' })
  const activeStep = STEPS[step]
  const progress = Math.round(((step + 1) / STEPS.length) * 100)
  // A resume import prefills every later step's state up front (see importParsedResume in
  // use-profile-editor.ts), so once that's happened there's no "unvisited" step left to
  // protect the user from — let the sidebar jump anywhere instead of forward-only.
  const navUnlocked = resumeFileName !== ''

  // Continue only moves on once the step in front of the user passes validation, so a
  // half-filled row can't slip through to a later step.
  async function goNext() {
    const isStepValid = await form.trigger(STEP_FIELDS[activeStep.id])
    if (!isStepValid) return
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0))
  }

  // The sidebar can jump past steps (see navUnlocked), so a save can fail on a step that
  // isn't on screen — take the user to the first one holding an error.
  function goToFirstInvalidStep(errors: FieldErrors<ProfileFormValues>) {
    const index = STEPS.findIndex((candidate) => STEP_FIELDS[candidate.id].some((field) => field in errors))
    if (index >= 0) setStep(index)
  }

  // Finishing and skipping both save whatever's been filled in so far and land on the
  // dashboard — "skip" just means "stop here," not "discard this." Either one is enough
  // for /auth/callback to treat this user as already onboarded next time they sign in.
  // Failure is already surfaced by the editor (toast plus the inline error on the review
  // step), so a false result just means stay put instead of navigating away from a
  // profile that didn't actually save.
  async function handleFinish() {
    if (!(await profileEditor.save(goToFirstInvalidStep))) return
    toast.success('Profile saved')
    router.push('/dashboard')
  }

  async function handleSkip() {
    if (!(await profileEditor.saveDraft())) return
    toast.success('Progress saved — finish your profile anytime')
    router.push('/dashboard')
  }

  return {
    ...profileEditor,
    isChecking,
    step,
    setStep,
    activeStep,
    progress,
    navUnlocked,
    goNext,
    goBack,
    handleFinish,
    handleSkip
  }
}
