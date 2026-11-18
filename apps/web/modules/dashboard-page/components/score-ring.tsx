import { getMatchLabel } from '@angkop/shared'
import { variantForScore } from '@/components/match-score-badge'
import { Badge } from '@/components/ui/badge'
import { SCORE_RING, SCORE_RING_STROKE } from '@/constants/score-ring'

const CENTER = SCORE_RING.SIZE / 2
const CIRCUMFERENCE = 2 * Math.PI * SCORE_RING.RADIUS

// The score as a ring that fills to the percentage, with its label underneath so the number is
// never shown without saying what it means. The sweep on load is the one animated moment on the
// dashboard (angkop-ring in globals.css) and is off for reduced motion.
export function ScoreRing({ score }: { score: number }) {
  const percent = Math.round(score * 100)
  const tone = variantForScore(score)
  const filled = CIRCUMFERENCE * Math.min(Math.max(score, 0), 1)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-28 sm:size-32" role="img" aria-label={`${percent} percent, ${getMatchLabel(score)}`}>
        <svg viewBox={`0 0 ${SCORE_RING.SIZE} ${SCORE_RING.SIZE}`} className="size-full -rotate-90" aria-hidden="true">
          <circle
            cx={CENTER}
            cy={CENTER}
            r={SCORE_RING.RADIUS}
            strokeWidth={SCORE_RING.STROKE_WIDTH}
            className="fill-none stroke-background"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={SCORE_RING.RADIUS}
            strokeWidth={SCORE_RING.STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
            className={`${SCORE_RING_STROKE[tone]} fill-none motion-safe:animate-[angkop-ring_900ms_ease-out_both]`}
          />
        </svg>
        <p className="absolute inset-0 flex items-center justify-center font-display text-3xl font-medium text-foreground tabular-nums sm:text-4xl">
          {percent}%
        </p>
      </div>
      <Badge variant={tone}>{getMatchLabel(score)}</Badge>
    </div>
  )
}
