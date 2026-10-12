import { StatStrip } from '@/components/stat-strip'

type SavedJobStats = {
  total: number
  inProgress: number
  upcomingInterviews: number
  successful: number
}

export function ApplicationStatsRow({ stats }: { stats: SavedJobStats }) {
  return (
    <StatStrip
      items={[
        { label: 'Total applications', value: stats.total, caption: "Jobs you're tracking" },
        { label: 'In progress', value: stats.inProgress, caption: 'Applied through interviewed' },
        { label: 'Interviews scheduled', value: stats.upcomingInterviews, caption: 'With a set interview date' },
        { label: 'Successful', value: stats.successful, caption: 'Offers and acceptances' }
      ]}
    />
  )
}
