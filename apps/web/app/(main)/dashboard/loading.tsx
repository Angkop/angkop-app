import { PageHeader } from '@/components/page-header'
import { DashboardSkeleton } from '@/modules/dashboard-page/components/dashboard-skeleton'

export default function Loading() {
  return (
    <div>
      <PageHeader title="Your matches" />
      <DashboardSkeleton />
    </div>
  )
}
