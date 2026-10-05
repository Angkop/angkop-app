import { useState } from 'react'
import { supabaseClient } from '@/lib/supabase-client'

export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signIn() {
    setIsLoading(true)
    setError(null)
    const { error: signInError } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    // A successful call navigates the whole page away to Google — this only still runs
    // when signInWithOAuth itself failed before that redirect could happen.
    if (signInError) {
      setError('Could not start Google sign-in. Please try again.')
      setIsLoading(false)
    }
  }

  return { isLoading, error, signIn }
}
