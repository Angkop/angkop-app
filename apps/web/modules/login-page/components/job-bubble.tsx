import { Check, Plus } from 'lucide-react'
import type { Ref } from 'react'
import { MatchScoreBadge } from '@/components/match-score-badge'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { JOBS, SKILLS } from '../constants'
import type { BubbleView } from './shift-model'

const BAR =
  'h-full origin-left rounded-full animate-[angkop-bar_1.2s_ease-out_both] motion-reduce:animate-none'

// What the capybara is wondering over its head. At a desk: how well it fits that job. It thinks
// for a moment, then shows the match as a percentage with its label, and the one skill that
// would close the gap. In the middle: its skills, set against both jobs, closest first.
// Positioned over the head by CapybaraShift, which writes its transform.
export function JobBubble({
  job,
  view,
  isVisible,
  ref
}: {
  job: number
  view: BubbleView
  isVisible: boolean
  ref?: Ref<HTMLDivElement>
}) {
  const current = JOBS[job]
  const ranked = [...JOBS].sort((a, b) => b.score - a.score)

  return (
    <div ref={ref} aria-hidden="true" className="absolute top-0 left-0 w-max will-change-transform">
      <div
        className={cn(
          'origin-bottom transition duration-300 ease-out',
          isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
      >
        {view === 'compare' ? (
          <div className="w-80 rounded-2xl border border-border bg-background px-4 py-3 shadow-xl">
            <p className="text-xs text-muted-foreground">These are my skills</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SKILLS.map((skill) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Which job is closer?</p>
            {ranked.map((entry, index) => (
              <div
                key={entry.title}
                className={cn(
                  'mt-1.5 rounded-xl border px-3 py-2',
                  index === 0 ? 'border-primary/40 bg-primary/5' : 'border-border'
                )}
              >
                <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                  {index === 0 && <Check className="size-3.5 text-primary" />}
                  {entry.title}
                </p>
                <div className="mt-1.5 flex items-center gap-3">
                  <MatchScoreBadge score={entry.score} />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={cn(BAR, entry.bar, entry.fill)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-56 rounded-2xl border border-border bg-background px-4 py-3 shadow-xl">
            <p className="text-xs text-muted-foreground">How well do I fit this job?</p>
            <p className="mt-0.5 text-base font-semibold tracking-tight text-foreground">{current.title}</p>

            {view === 'scored' ? (
              <>
                <div className="mt-2.5">
                  <MatchScoreBadge score={current.score} />
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={cn(BAR, current.bar, current.fill)} />
                </div>
                <p className="mt-2.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <Plus className="size-3.5 text-primary" />
                  {current.gap}
                </p>
              </>
            ) : (
              <div className="mt-3.5 flex gap-1.5">
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    className={cn(
                      'size-2 animate-pulse rounded-full bg-muted-foreground/40',
                      dot === 1 && '[animation-delay:150ms]',
                      dot === 2 && '[animation-delay:300ms]'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        <span className="mx-auto mt-1.5 block size-3 rounded-full border border-border bg-background shadow-sm" />
        <span className="mx-auto mt-1 block size-1.5 rounded-full border border-border bg-background" />
      </div>
    </div>
  )
}
