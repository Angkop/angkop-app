import { Briefcase, CalendarClock, CheckCircle2, Hourglass } from 'lucide-react'
import type { SavedJob } from '@angkop/shared'
import { StatCard } from '@/components/stat-card'

const IN_PROGRESS_STATUSES = new Set(['APPLIED', 'AWAITING_INTERVIEW', 'ONGOING_INTERVIEW', 'INTERVIEWED'])

export function ApplicationStatsRow({ savedJobs }: { savedJobs: SavedJob[] }) {
  const inProgressCount = savedJobs.filter((savedJob) => IN_PROGRESS_STATUSES.has(savedJob.status)).length
  const upcomingInterviewCount = savedJobs.filter((savedJob) => Boolean(savedJob.interviewDate)).length
  const successfulCount = savedJobs.filter((savedJob) => savedJob.status === 'SUCCESSFUL').length

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Total Applications" value={savedJobs.length} caption="Jobs you're tracking" icon={Briefcase} />
      <StatCard
        label="In Progress"
        value={inProgressCount}
        caption="Applied through interviewed"
        icon={Hourglass}
      />
      <StatCard
        label="Interviews Scheduled"
        value={upcomingInterviewCount}
        caption="With a set interview date"
        icon={CalendarClock}
      />
      <StatCard label="Successful" value={successfulCount} caption="Offers and acceptances" icon={CheckCircle2} />
    </div>
  )
}
