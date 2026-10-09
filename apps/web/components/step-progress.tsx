'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const DEFAULT_STEP_DURATION_MS = 900

// A labeled sequence of steps that advances on a timer while something's loading — used
// anywhere an AI/ML call takes a few real seconds, so the wait reads as "doing something
// specific" instead of an opaque skeleton. The steps are illustrative, not literal
// progress events from the server (same approach the resume import flow already used).
export function StepProgress({
  steps,
  stepDurationMs = DEFAULT_STEP_DURATION_MS
}: {
  steps: string[]
  stepDurationMs?: number
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setActiveIndex(0)
    const interval = setInterval(() => {
      setActiveIndex((current) => Math.min(current + 1, steps.length - 1))
    }, stepDurationMs)
    return () => clearInterval(interval)
  }, [steps.length, stepDurationMs])

  return (
    <ol className="space-y-3">
      {steps.map((step, index) => {
        const status = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'pending'
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium transition-colors',
                status === 'done' && 'bg-primary text-primary-foreground',
                status === 'active' && 'border-2 border-primary text-primary',
                status === 'pending' && 'border border-border text-muted-foreground'
              )}
            >
              {status === 'done' ? <Check className="size-3" /> : index + 1}
            </span>
            <span
              className={cn(
                'text-sm transition-colors',
                status === 'pending' ? 'text-muted-foreground' : 'text-foreground',
                status === 'active' && 'font-medium'
              )}
            >
              {step}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
