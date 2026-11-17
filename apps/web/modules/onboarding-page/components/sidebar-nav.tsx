import Link from 'next/link'
import { Check } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { cn } from '@/lib/utils'
import { STEPS } from '../constants'

export function SidebarNav({
  step,
  onStepClick,
  disabled = false
}: {
  step: number
  onStepClick: (index: number) => void
  disabled?: boolean
}) {
  return (
    <aside className="hidden flex-col justify-between overflow-y-auto bg-primary p-12 text-primary-foreground lg:flex">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60"
        >
          <BrandMark className="size-8" />
          <span className="pt-2 font-display text-xl font-medium tracking-tight">Angkop</span>
        </Link>

        <div className="mt-12">
          <h1 className="font-display text-3xl leading-tight font-medium tracking-tight">Set up your profile</h1>
          <p className="mt-2 text-sm text-primary-foreground/70">
            The more we know, the better your matches. Jump to any step, in any order.
          </p>
        </div>

        <div className="mt-8">
          <p className="text-xs font-medium text-primary-foreground/70">
            Step {step + 1} of {STEPS.length}
          </p>
          <div
            role="progressbar"
            aria-label="Onboarding progress"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
            className="mt-2 flex gap-1"
          >
            {STEPS.map((s, index) => (
              <span
                key={s.id}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  index <= step ? 'bg-primary-foreground' : 'bg-primary-foreground/20'
                )}
              />
            ))}
          </div>
        </div>

        <nav aria-label="Onboarding steps" className="mt-8">
          <ol>
            {STEPS.map((s, index) => {
              const Icon = s.icon
              const isActive = index === step
              const isDone = index < step
              const isLast = index === STEPS.length - 1
              return (
                <li key={s.id} className="relative">
                  <button
                    type="button"
                    onClick={() => onStepClick(index)}
                    disabled={disabled}
                    aria-current={isActive ? 'step' : undefined}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-lg px-1.5 py-1.5 text-left text-sm outline-none transition-colors hover:bg-primary-foreground/10 focus-visible:ring-2 focus-visible:ring-primary-foreground/60 disabled:cursor-not-allowed',
                      isActive ? 'font-medium text-primary-foreground' : isDone ? 'text-primary-foreground' : 'text-primary-foreground/60'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors',
                        isActive && 'border-primary-foreground bg-primary-foreground text-primary',
                        isDone && 'border-primary-foreground/40 bg-primary-foreground/20 text-primary-foreground',
                        !isActive && !isDone && 'border-primary-foreground/30 text-primary-foreground/60'
                      )}
                    >
                      {isDone ? <Check className="size-3.5" strokeWidth={3} /> : <Icon className="size-3.5" />}
                    </span>
                    {s.label}
                  </button>
                  {isLast ? null : (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute top-[34px] left-5 h-3 w-px -translate-x-1/2',
                        isDone ? 'bg-primary-foreground/40' : 'bg-primary-foreground/20'
                      )}
                    />
                  )}
                </li>
              )
            })}
          </ol>
        </nav>
      </div>

      <p className="mt-8 text-xs text-primary-foreground/60">Everything you add here stays editable from Profile.</p>
    </aside>
  )
}
