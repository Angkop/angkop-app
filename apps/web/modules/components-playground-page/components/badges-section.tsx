import { getMatchLabel } from '@angkop/shared'
import { MatchScoreBadge } from '@/components/match-score-badge'
import { Badge } from '@/components/ui/badge'
import { MATCH_SCORE_SAMPLES } from '../constants/sample-data'
import { PlaygroundSection, Variant } from './playground-section'

const BADGE_VARIANTS = ['default', 'outline', 'secondary', 'strong', 'partial', 'weak'] as const

export function BadgesSection() {
  return (
    <PlaygroundSection
      id='badges'
      title='Badges and Match Score'
      description='A score is always a percentage with a label beside it: green at 70% and up, yellow from 40% to 69%, red below 40%. The color never carries the meaning alone.'
    >
      <Variant
        label='Badge variants'
        usage={'<Badge variant="default | outline | secondary | strong | partial | weak">'}
      >
        <div className='flex flex-wrap gap-2'>
          {BADGE_VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </Variant>
      <Variant label='Match score, all three bands' usage='<MatchScoreBadge score={0.92} />' wide>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {MATCH_SCORE_SAMPLES.map((sample) => (
            <div key={sample.score} className='space-y-1 rounded-md border border-border p-3'>
              <MatchScoreBadge score={sample.score} />
              <p className='text-[11px] text-muted-foreground'>
                score {sample.score}: {getMatchLabel(sample.score)}. {sample.note}.
              </p>
            </div>
          ))}
        </div>
      </Variant>
    </PlaygroundSection>
  )
}
