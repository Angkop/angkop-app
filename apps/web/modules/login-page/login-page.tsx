'use client'

import { LoginHero } from './components/login-hero'
import { SignInPanel } from './components/sign-in-panel'
import { useGoogleSignIn } from './hooks/use-google-sign-in'

export function LoginPage() {
  const { isLoading, error, signIn } = useGoogleSignIn()

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <LoginHero />
      <SignInPanel isLoading={isLoading} error={error} onSignIn={signIn} />
    </div>
  )
}
