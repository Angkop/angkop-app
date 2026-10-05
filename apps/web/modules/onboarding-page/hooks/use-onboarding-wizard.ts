import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase-client'
import { useProfileEditor } from '@/hooks/use-profile-editor'
import { STEPS } from '../constants'

export function useOnboardingWizard() {
  const router = useRouter()
  const profileEditor = useProfileEditor()
  const [isChecking, setIsChecking] = useState(true)
  const [step, setStep] = useState(0)

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

  const activeStep = STEPS[step]
  const progress = Math.round(((step + 1) / STEPS.length) * 100)
  const canContinue = step !== 0 || profileEditor.careerLevel !== ''

  function goNext() {
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0))
  }

  // Finishing and skipping both save whatever's been filled in so far and land on the
  // dashboard — "skip" just means "stop here," not "discard this." Either one is enough
  // for /auth/callback to treat this user as already onboarded next time they sign in.
  async function saveAndGoToDashboard() {
    await profileEditor.submit()
    router.push('/dashboard')
  }

  async function handleFinish() {
    await saveAndGoToDashboard()
  }

  async function handleSkip() {
    await saveAndGoToDashboard()
  }

  return {
    ...profileEditor,
    isChecking,
    step,
    setStep,
    activeStep,
    progress,
    canContinue,
    goNext,
    goBack,
    handleFinish,
    handleSkip
  }
}
