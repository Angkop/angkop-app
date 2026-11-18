import { Skeleton } from '@/components/ui/skeleton'

export function MatchDetailSkeleton() {
  return (
    <div>
      <div className="mb-10 border-b border-border pb-10">
        <div className="flex items-center gap-2">
          <Skeleton className="size-7" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-6 h-10 w-3/4 sm:h-14" />
        <Skeleton className="mt-4 h-5 w-1/3" />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4 lg:order-2">
          <Skeleton className="h-60 rounded-xl border border-border" />
          <Skeleton className="h-9" />
          <Skeleton className="h-8" />
        </div>
        <div className="space-y-12 lg:order-1">
          <div className="space-y-4">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-28 rounded-lg border border-border" />
            <Skeleton className="h-40 rounded-lg border border-border" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-16 rounded-md border border-border" />
            <Skeleton className="h-48 rounded-lg border border-border" />
          </div>
        </div>
      </div>
    </div>
  )
}
