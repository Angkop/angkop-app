'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ErrorMessage } from '@/components/error-message'
import { devLogin } from '@/lib/auth'

// Google's fixed brand mark — not a themeable icon, so its colors stay literal rather than tokens.
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-1 2.9-2.9 5.3-5.4 7l6.2 5.2C39.5 37.6 44 31.3 44 24c0-1.3-.1-2.7-.4-3.9z"
      />
    </svg>
  )
}

export function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinueAsDemoUser() {
    setIsLoading(true)
    setError(null)
    try {
      await devLogin()
      router.push('/onboarding')
    } catch {
      setError('Could not sign in. Confirm the Express API is running and seeded, then try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground sm:p-12 lg:flex lg:p-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '36px 36px'
          }}
        />

        <div className="relative inline-flex w-fit items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary-foreground/15 text-sm font-semibold">
            A
          </span>
          <span className="text-lg font-semibold tracking-tight">Angkop</span>
        </div>

        <div className="relative">
          <h1 className="max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
            Matches that actually fit, not just keywords that match.
          </h1>
          <p className="mt-4 max-w-sm text-sm text-primary-foreground/75 sm:text-base">
            Angkop ranks job postings against your real skills and experience, then shows you exactly what&apos;s
            missing for the ones you want.
          </p>
        </div>

        <p className="relative text-xs text-primary-foreground/50">Angkop</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
              A
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">Angkop</span>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-foreground">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to see your matches and pick up where you left off.
          </p>

          <Button
            variant="outline"
            className="mt-6 w-full border-foreground/15 shadow-sm hover:bg-accent/60"
            onClick={handleContinueAsDemoUser}
            disabled={isLoading}
          >
            <GoogleIcon className="size-4" />
            {isLoading ? 'Signing in…' : 'Continue with Google'}
          </Button>
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo build — this signs you in as a sample user instead of your real Google account.
          </p>
        </div>
      </div>
    </div>
  )
}
