import { Skeleton } from '@/components/ui/skeleton'
import { GAP_PATH_COUNT, LANE_MATCHES_COUNT } from '@/constants/dashboard'

// One skeleton per region, shaped like the content it stands in for, so each region can swap
// in as soon as its own query returns without the page shifting.
function LaneSkeleton() {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5 border-t-2 border-border pt-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-40" />
      </div>
      {Array.from({ length: LANE_MATCHES_COUNT }, (_, index) => (
        <Skeleton key={index} className="h-11 w-full" />
      ))}
    </div>
  )
}

export function MatchesSkeleton() {
  return (
    <div className="space-y-12">
      <Skeleton className="h-64 w-full rounded-2xl sm:h-56" />
      <div className="grid gap-8 lg:grid-cols-2">
        <LaneSkeleton />
        <LaneSkeleton />
      </div>
    </div>
  )
}

export function PipelineSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-40" />
      <div className="flex gap-2 sm:gap-0">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function GapPathSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-32" />
      <div className="space-y-5 pt-2">
        {Array.from({ length: GAP_PATH_COUNT }, (_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-56" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-12">
      <MatchesSkeleton />
      <PipelineSkeleton />
      <GapPathSkeleton />
    </div>
  )
}
