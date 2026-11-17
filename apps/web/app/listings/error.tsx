'use client'

import { RouteError } from '@/components/route-error'

export default function ListingsError({ reset }: { error: Error; reset: () => void }) {
  return <RouteError title="Could not load listings" onReset={reset} />
}
