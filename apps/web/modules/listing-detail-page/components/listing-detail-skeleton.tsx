export function ListingDetailSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6 h-4 w-28 animate-pulse rounded bg-muted" />

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-5 w-16 shrink-0 animate-pulse rounded-full bg-muted" />
        </div>

        <div className="mt-4 h-16 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 h-32 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-6 w-16 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  )
}
