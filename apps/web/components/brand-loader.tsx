'use client'

import { useEffect, useRef, useState } from 'react'
import { BrandMark } from '@/components/brand-mark'
import { cn } from '@/lib/utils'

// Angkop's loading mark: a soft 3D capybara trotting in place, standing in for a generic spinner
// wherever the app is working on a match. It is the same model as the sign-in hero, drawn live
// with three.js (no images), and it tries on a new outfit every few seconds the way that hero tries
// on jobs: a graduation cap for the fresh graduate, then the marketing and construction outfits.
// The scene is fetched the first time a loader mounts (brand-loader-scene.ts). It fades in after a
// short delay, so a load that finishes quickly never flashes it; without WebGL the flat BrandMark
// pulses in its place, and under reduced motion it holds one still frame.
const SIZE_VARIANTS = {
  sm: 'size-12',
  md: 'size-20',
  lg: 'size-32'
} as const

export function BrandLoader({
  size = 'md',
  className
}: {
  size?: keyof typeof SIZE_VARIANTS
  className?: string
}) {
  const container = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    const host = container.current
    if (!host) return

    let isCancelled = false
    let unmount: (() => void) | undefined
    import('./brand-loader-scene')
      .then(({ mountBrandLoaderScene }) => {
        if (!isCancelled) unmount = mountBrandLoaderScene(host, () => setIsReady(true))
      })
      .catch(() => {
        if (!isCancelled) setHasFailed(true)
      })

    return () => {
      isCancelled = true
      unmount?.()
    }
  }, [])

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('angkop-loader angkop-loader-delay relative shrink-0', SIZE_VARIANTS[size], className)}
    >
      {hasFailed && <BrandMark className="size-full animate-pulse motion-reduce:animate-none" />}
      <div
        ref={container}
        aria-hidden="true"
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-300 motion-reduce:transition-none',
          isReady && 'opacity-100'
        )}
      />
    </div>
  )
}
