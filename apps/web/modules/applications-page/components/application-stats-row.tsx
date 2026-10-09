import { Briefcase, CalendarClock, CheckCircle2, Hourglass } from 'lucide-react'
import { StatCard } from '@/components/stat-card'

type SavedJobStats = {
  total: number
  inProgress: number
  upcomingInterviews: number
  successful: number
}

export function ApplicationStatsRow({ stats }: { stats: SavedJobStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Total Applications" value={stats.total} caption="Jobs you're tracking" icon={Briefcase} />
      <StatCard
        label="In Progress"
        value={stats.inProgress}
        caption="Applied through interviewed"
        icon={Hourglass}
      />
      <StatCard
        label="Interviews Scheduled"
        value={stats.upcomingInterviews}
        caption="With a set interview date"
        icon={CalendarClock}
      />
      <StatCard label="Successful" value={stats.successful} caption="Offers and acceptances" icon={CheckCircle2} />
    </div>
  )
}
