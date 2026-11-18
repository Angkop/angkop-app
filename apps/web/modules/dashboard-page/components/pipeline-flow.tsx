import { APPLICATION_STATUS_LABELS } from '@angkop/shared'
import { cn } from '@/lib/utils'
import type { PipelineStatusCount } from '../types'

// The stages an application moves through, in order. Unsuccessful is where an application can
// end instead of continuing, so it sits outside the line rather than as a seventh step on it.
function isStage({ status }: PipelineStatusCount) {
  return status !== 'UNSUCCESSFUL'
}

// A journey, not a table of counts: each stage is a node on a line, filled once at least one
// application is there. Stacked down the left on a phone, laid out in a row from `sm` up.
export function PipelineFlow({ statusCounts }: { statusCounts: PipelineStatusCount[] }) {
  const stages = statusCounts.filter(isStage)
  const unsuccessful = statusCounts.find((entry) => entry.status === 'UNSUCCESSFUL')?.count ?? 0

  return (
    <div>
      <ol className="flex flex-col sm:flex-row">
        {stages.map(({ status, count }, index) => (
          <li
            key={status}
            className="relative flex items-center gap-3 pb-4 last:pb-0 sm:flex-1 sm:flex-col sm:gap-2 sm:pb-0 sm:text-center"
          >
            <span
              className={cn(
                'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-medium tabular-nums',
                count > 0
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-dashed border-foreground/25 bg-background text-muted-foreground'
              )}
            >
              {count}
            </span>
            <span className={cn('text-xs text-balance', count > 0 ? 'text-foreground' : 'text-muted-foreground')}>
              {APPLICATION_STATUS_LABELS[status]}
            </span>

            {/* Line to the next stage: down on a phone, across from `sm` up. None after the last. */}
            {index < stages.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-9 left-[17px] h-4 w-px bg-border sm:top-[17px] sm:left-[calc(50%+26px)] sm:h-px sm:w-[calc(100%-52px)]"
              />
            ) : null}
          </li>
        ))}
      </ol>

      {unsuccessful > 0 ? (
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">{unsuccessful}</span>{' '}
          {APPLICATION_STATUS_LABELS.UNSUCCESSFUL.toLowerCase()}
        </p>
      ) : null}
    </div>
  )
}
