export function ListingsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="h-9 w-full animate-pulse rounded-md border border-border bg-muted sm:w-64" />
          <div className="h-9 w-full animate-pulse rounded-md border border-border bg-muted sm:w-40" />
          <div className="h-9 w-full animate-pulse rounded-md border border-border bg-muted sm:w-48" />
        </div>
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg border border-border bg-muted" />
        ))}
      </div>
    </div>
  )
}
