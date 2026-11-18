import type { ReactNode } from 'react'

// The hairline grid from the Magic UI blog template: cells share their borders instead of
// floating as separate cards. Each cell draws its own right and bottom line; the inner grid is
// pulled 1px past the frame so the last column and row's lines tuck under the frame's border.
export function MatchGrid({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="-mr-px -mb-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  )
}
