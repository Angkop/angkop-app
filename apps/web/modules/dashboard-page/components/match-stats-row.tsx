import { Sparkles, Target } from 'lucide-react'
import { MATCH_SCORE_THRESHOLDS, type JobMatch } from '@angkop/shared'
import { StatCard } from '@/components/stat-card'

export function MatchStatsRow({ matches }: { matches: JobMatch[] }) {
  const strongMatches = matches.filter((match) => match.hybridScore >= MATCH_SCORE_THRESHOLDS.STRONG)

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="New Matches" value={matches.length} caption="From ingested listings" icon={Sparkles} />
      <StatCard
        label="Strong Matches"
        value={strongMatches.length}
        caption="70% hybrid score or higher"
        icon={Target}
      />
    </div>
  )
}
