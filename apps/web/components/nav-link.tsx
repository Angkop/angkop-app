'use client'

import type { ComponentProps, MouseEvent } from 'react'
import Link, { useLinkStatus } from 'next/link'
import { createPortal } from 'react-dom'
import { BrandLoader } from '@/components/brand-loader'

// useLinkStatus only works from inside a <Link>, so the overlay is a child of NavLink. It is
// portaled to <body> so it covers the screen whatever the link's own layout is, and it fades
// in after a short delay (angkop-loader-delay), so a navigation that finishes quickly never
// flashes it. It also blocks a second click while the first navigation is still loading.
function PendingOverlay({ label }: { label: string }) {
  const { pending } = useLinkStatus()
  if (!pending) return null

  return createPortal(
    // React bubbles events through a portal to its parent, which would re-click the Link.
    <div
      onClick={(event: MouseEvent) => event.stopPropagation()}
      className="angkop-loader-delay fixed inset-0 z-60 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-[2px]"
    >
      <BrandLoader size="lg" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>,
    document.body
  )
}

// A next/link that shows the beaver loader from the click until the next page is ready,
// instead of leaving the screen unchanged while a slow route loads.
export function NavLink({
  pendingLabel = 'Loading…',
  children,
  ...props
}: ComponentProps<typeof Link> & { pendingLabel?: string }) {
  return (
    <Link {...props}>
      {children}
      <PendingOverlay label={pendingLabel} />
    </Link>
  )
}
