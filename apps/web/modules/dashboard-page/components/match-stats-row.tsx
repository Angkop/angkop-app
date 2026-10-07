import { Sparkles, Target } from 'lucide-react'
import { StatCard } from '@/components/stat-card'

export function MatchStatsRow({ totalCount, strongMatchCount }: { totalCount: number; strongMatchCount: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="New Matches" value={totalCount} caption="From ingested listings" icon={Sparkles} />
      <StatCard label="Strong Matches" value={strongMatchCount} caption="70% hybrid score or higher" icon={Target} />
    </div>
  )
}
