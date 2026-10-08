import { PageHeader } from '@/components/page-header'
import { ApplicationsSkeleton } from '@/modules/applications-page/components/applications-skeleton'

export default function Loading() {
  return (
    <div>
      <PageHeader title="Applications" description="Track every saved job through your application process." />
      <ApplicationsSkeleton />
    </div>
  )
}
