import { PageHeader } from '@/components/page-header'
import { AllMatchesSkeleton } from '@/modules/all-matches-page/components/all-matches-skeleton'

export default function Loading() {
  return (
    <div>
      <PageHeader title="All Matches" description="Every ingested job ranked by fit with your profile." />
      <AllMatchesSkeleton />
    </div>
  )
}
