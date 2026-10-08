import { LoadingSkeleton } from '@/components/loading-skeleton'
import { TOP_MATCHES_COUNT } from '@/constants/dashboard'

export function DashboardSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border border-border bg-muted" />
        ))}
      </div>
      <div className="mt-8">
        <div className="mb-3 h-5 w-24 animate-pulse rounded bg-muted" />
        <LoadingSkeleton rows={TOP_MATCHES_COUNT} heightClassName="h-16" />
      </div>
    </div>
  )
}
