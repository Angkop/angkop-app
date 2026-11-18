import { MatchGrid } from '@/components/match-grid'
import { Skeleton } from '@/components/ui/skeleton'
import { PAGE_SIZE } from '../constants'

// One empty cell of the grid. Also fills the slot of a job that was just saved or dismissed
// while the page fetches its replacement.
export function MatchCardSkeleton() {
  return (
    <div className="flex flex-col border-r border-b border-border bg-background">
      <div className="space-y-3 p-6">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-14 w-full" />
        <div className="flex gap-1.5 pt-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border px-6 py-3">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  )
}

export function MatchesGridSkeleton() {
  return (
    <MatchGrid>
      {Array.from({ length: PAGE_SIZE }, (_, index) => (
        <MatchCardSkeleton key={index} />
      ))}
    </MatchGrid>
  )
}

export function AllMatchesSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-full border border-border sm:w-80" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>
      <MatchesGridSkeleton />
    </div>
  )
}
