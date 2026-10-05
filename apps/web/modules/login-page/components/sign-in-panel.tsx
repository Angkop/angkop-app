import { Button } from '@/components/ui/button'
import { ErrorMessage } from '@/components/error-message'
import { GoogleIcon } from './google-icon'

export function SignInPanel({
  isLoading,
  error,
  onSignIn
}: {
  isLoading: boolean
  error: string | null
  onSignIn: () => void
}) {
  return (
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
          onClick={onSignIn}
          disabled={isLoading}
        >
          <GoogleIcon className="size-4" />
          {isLoading ? 'Signing in…' : 'Continue with Google'}
        </Button>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </div>
    </div>
  )
}
