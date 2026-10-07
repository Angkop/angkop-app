import { Button } from '@/components/ui/button'

export function PaginationControls({
  page,
  pageCount,
  onChange
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onChange(Math.max(1, page - 1))}>
        Previous
      </Button>
      <p className="text-xs text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={page === pageCount}
        onClick={() => onChange(Math.min(pageCount, page + 1))}
      >
        Next
      </Button>
    </div>
  )
}
