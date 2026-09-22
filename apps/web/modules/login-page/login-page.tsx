'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { devLogin } from '@/lib/auth'

export function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleContinueAsDemoUser() {
    setIsLoading(true)
    setError(null)
    try {
      await devLogin()
      router.push('/')
    } catch {
      setError('Could not sign in. Confirm the Express API is running and seeded, then try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Angkop</CardTitle>
          <CardDescription>
            Local MVP build — dev-only sign-in, no Google account required. Real Google OAuth via
            Supabase Auth is the documented production plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={handleContinueAsDemoUser} disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Continue as Demo User'}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </main>
  )
}
