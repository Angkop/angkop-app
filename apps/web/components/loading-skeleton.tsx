import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type LoadingSkeletonProps = {
  rows?: number
  heightClassName?: string
}

export function LoadingSkeleton({ rows = 1, heightClassName = 'h-24' }: LoadingSkeletonProps) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className={cn('rounded-lg border border-border', heightClassName)} />
      ))}
    </div>
  )
}
