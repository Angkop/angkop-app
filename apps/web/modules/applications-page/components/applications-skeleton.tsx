import { LoadingSkeleton } from '@/components/loading-skeleton'

export function ApplicationsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-lg border border-border bg-muted" />
        ))}
      </div>
      <div className="h-9 w-56 animate-pulse rounded-md border border-border bg-muted" />
      <LoadingSkeleton rows={3} heightClassName="h-28" />
    </div>
  )
}
