'use client'

import { SignInPanel } from './components/sign-in-panel'
import { useGoogleSignIn } from './hooks/use-google-sign-in'

export function LoginPage() {
  const { isLoading, error, signIn } = useGoogleSignIn()

  return <SignInPanel isLoading={isLoading} error={error} onSignIn={signIn} />
}
