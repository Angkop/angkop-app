import Link from 'next/link'
import { Check } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { cn } from '@/lib/utils'
import { STEPS } from '../constants'

export function SidebarNav({
  step,
  progress,
  onStepClick,
  disabled = false
}: {
  step: number
  progress: number
  onStepClick: (index: number) => void
  disabled?: boolean
}) {
  return (
    <div className="hidden flex-col justify-between bg-primary p-8 text-primary-foreground sm:p-12 lg:flex lg:p-12">
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium">
          <BrandMark />
          Angkop
        </Link>

        <div className="mt-10">
          <p className="text-xs font-medium text-primary-foreground/70">
            Step {step + 1} of {STEPS.length}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary-foreground/15">
            <div
              className="h-full rounded-full bg-primary-foreground transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {STEPS.map((s, index) => {
            const Icon = s.icon
            const isActive = index === step
            const isDone = index < step
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onStepClick(index)}
                disabled={disabled}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-lg border border-transparent px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed',
                  isActive && 'bg-primary-foreground/10 font-medium text-primary-foreground',
                  !isActive && isDone && 'text-primary-foreground hover:bg-primary-foreground/5',
                  !isActive && !isDone && 'text-primary-foreground/50 hover:bg-primary-foreground/5 hover:text-primary-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]',
                    isDone && 'bg-primary-foreground text-primary',
                    isActive && !isDone && 'bg-primary-foreground/20 text-primary-foreground',
                    !isActive && !isDone && 'bg-primary-foreground/10 text-primary-foreground/50'
                  )}
                >
                  {isDone ? <Check className="size-3" /> : index + 1}
                </span>
                <Icon className="size-3.5 shrink-0" />
                {s.label}
              </button>
            )
          })}
        </nav>
      </div>

      <p className="text-xs text-primary-foreground/50">Angkop</p>
    </div>
  )
}
