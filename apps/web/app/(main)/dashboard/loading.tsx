import { PageHeader } from '@/components/page-header'
import { DashboardSkeleton } from '@/modules/dashboard-page/components/dashboard-skeleton'

export default function Loading() {
  return (
    <div>
      <PageHeader title="Your matches" description="Jobs ranked by how well they fit your profile." />
      <DashboardSkeleton />
    </div>
  )
}
