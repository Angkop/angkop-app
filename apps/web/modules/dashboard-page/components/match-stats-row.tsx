import { StatStrip } from '@/components/stat-strip'

export function MatchStatsRow({ totalCount, strongMatchCount }: { totalCount: number; strongMatchCount: number }) {
  return (
    <StatStrip
      items={[
        { label: 'New matches', value: totalCount, caption: 'From ingested listings' },
        { label: 'Strong matches', value: strongMatchCount, caption: '70% hybrid score or higher' }
      ]}
    />
  )
}
