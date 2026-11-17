import { BrandMark } from '@/components/brand-mark'
import { ErrorMessage } from '@/components/error-message'
import { Button } from '@/components/ui/button'
import { Highlighter } from '@/components/ui/highlighter'
import { cn } from '@/lib/utils'
import { CapybaraStage } from './capybara-stage'
import { GoogleIcon } from './google-icon'
import { RISE } from './rise'

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
    <main className="angkop-login relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-7xl items-center gap-2.5 px-6 py-8 sm:px-12">
        <BrandMark className="size-9" />
        <span className="text-lg font-semibold tracking-tight">Angkop</span>
      </header>

      {/* Bottom padding on small screens keeps the form clear of the capybara below it. */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 pb-[70vw] sm:px-12 lg:pb-28">
        <div className="flex w-full max-w-2xl flex-col">
          <h1
            className={cn(
              RISE,
              'text-[clamp(1.375rem,4.4vw,2.75rem)] leading-[1.15] font-semibold tracking-tight'
            )}
          >
            <span className="whitespace-nowrap">
              Matches that{' '}
              <Highlighter animationDuration={1800} repeatInterval={5000}>
                actually fit
              </Highlighter>
              ,
            </span>
            <br />
            not just keywords that match.
          </h1>
          <p className={cn(RISE, 'mt-6 max-w-md text-lg text-muted-foreground [animation-delay:80ms]')}>
            Angkop ranks job postings against your real skills and experience, then shows you exactly
            what&apos;s missing for the ones you want.
          </p>

          <div className={cn(RISE, 'mt-10 flex max-w-sm flex-col gap-2 [animation-delay:160ms]')}>
            <Button
              variant="outline"
              className="h-12 w-full border-foreground/15 bg-background text-foreground shadow-sm hover:bg-accent/60"
              onClick={onSignIn}
              disabled={isLoading}
            >
              <GoogleIcon className="size-4" />
              {isLoading ? 'Signing in…' : 'Continue with Google'}
            </Button>
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-1/2 bottom-0 w-[94vw] max-w-xl translate-x-1/2 animate-[angkop-peek_0.9s_cubic-bezier(0.22,1,0.36,1)_both] [animation-delay:150ms] lg:right-[5vw] lg:w-[min(46vw,700px,88vh)] lg:max-w-none lg:translate-x-0">
        <CapybaraStage />
      </div>
    </main>
  )
}
