import { getMatchLabel } from '@angkop/shared'
import { Badge } from '@/components/ui/badge'

function variantForScore(score: number): 'strong' | 'partial' | 'weak' {
  const label = getMatchLabel(score)
  if (label === 'Strong Match') return 'strong'
  if (label === 'Partial Match') return 'partial'
  return 'weak'
}

export function MatchScoreBadge({ score }: { score: number }) {
  const percent = Math.round(score * 100)
  return (
    <div className="flex items-center gap-2">
      <Badge variant={variantForScore(score)}>{percent}%</Badge>
      <span className="text-sm text-muted-foreground">{getMatchLabel(score)}</span>
    </div>
  )
}
