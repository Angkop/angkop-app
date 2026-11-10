import { ArrowDown, X } from 'lucide-react'
import { MatchScoreBadge } from '@/components/match-score-badge'
import { cn } from '@/lib/utils'
import { MATCH_EXAMPLES } from '../constants'

// Angkop's pitch in one card: a profile and a posting that share no words, so keyword search
// finds nothing, scored by meaning instead. Cycles through MATCH_EXAMPLES (angkop-slide in
// globals.css); with reduced motion only the first example shows.
export function MatchDemo({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('w-80 rounded-2xl border border-border bg-background p-5 shadow-xl', className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Meaning, not keywords</p>
        <p className="text-xs text-muted-foreground">Example</p>
      </div>

      <div className="relative mt-4 h-40">
        {MATCH_EXAMPLES.map((example, index) => (
          <div
            key={example.job}
            className={cn(
              'absolute inset-0 flex flex-col opacity-0 animate-[angkop-slide_12s_ease-in-out_infinite]',
              example.delay,
              index === 0 ? 'motion-reduce:opacity-100' : 'motion-reduce:hidden'
            )}
          >
            <p className="text-sm text-muted-foreground">{example.profile}</p>
            <ArrowDown className="my-1 size-3.5 text-muted-foreground" />
            <p className="text-lg font-semibold tracking-tight text-foreground">{example.job}</p>

            <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">Keyword search</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <X className="size-3.5 text-destructive" />
                No words in common
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Angkop</span>
              <MatchScoreBadge score={example.score} />
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full origin-left rounded-full bg-primary animate-[angkop-bar_12s_ease-out_infinite]',
                  example.bar,
                  example.delay
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
