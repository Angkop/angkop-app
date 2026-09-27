type LoadingSkeletonProps = {
  rows?: number
  heightClassName?: string
}

export function LoadingSkeleton({ rows = 1, heightClassName = 'h-24' }: LoadingSkeletonProps) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={`${heightClassName} animate-pulse rounded-lg border border-border bg-muted`} />
      ))}
    </div>
  )
}
