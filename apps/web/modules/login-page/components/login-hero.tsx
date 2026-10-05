export function LoginHero() {
  return (
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
  )
}
