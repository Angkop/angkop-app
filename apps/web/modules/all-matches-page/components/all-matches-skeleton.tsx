import { LoadingSkeleton } from '@/components/loading-skeleton'

export function AllMatchesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="h-9 w-full animate-pulse rounded-md border border-border bg-muted sm:w-64" />
          <div className="h-9 w-full animate-pulse rounded-md border border-border bg-muted sm:w-48" />
        </div>
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      </div>
      <LoadingSkeleton rows={6} heightClassName="h-16" />
    </div>
  )
}
