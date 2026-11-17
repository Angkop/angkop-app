'use client'

import { RouteError } from '@/components/route-error'

export default function MainError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError title="Could not load this page" onReset={reset} />
}
