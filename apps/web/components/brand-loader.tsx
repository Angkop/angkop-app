import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

// Candidate (center) with job matches orbiting at different radii, speeds, and
// directions until one locks in — Angkop's loading mark, standing in for a generic
// spinner wherever the app is working on a match.
const ORBIT_DOTS = [
  { radiusFraction: 0.34, size: 'size-2', color: 'bg-primary', duration: '1.8s', delay: '0s', reverse: false },
  {
    radiusFraction: 0.62,
    size: 'size-1.5',
    color: 'bg-accent-foreground',
    duration: '2.6s',
    delay: '0.15s',
    reverse: true
  },
  { radiusFraction: 0.2, size: 'size-1', color: 'bg-primary/60', duration: '1.3s', delay: '0.3s', reverse: false }
] as const

// translateX() resolves percentages against the dot's own (tiny) box, not the
// container, so the orbit radius has to be a real length — computed per size variant.
const SIZE_VARIANTS = {
  sm: { className: 'size-8', containerPx: 32 },
  md: { className: 'size-14', containerPx: 56 },
  lg: { className: 'size-20', containerPx: 80 }
} as const

export function BrandLoader({
  size = 'md',
  className
}: {
  size?: keyof typeof SIZE_VARIANTS
  className?: string
}) {
  const variant = SIZE_VARIANTS[size]

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('angkop-loader relative shrink-0', variant.className, className)}
    >
      <span className="absolute inset-[22%] rounded-full bg-primary/15 animate-ping" />
      <span className="absolute inset-[38%] rounded-full bg-primary" />
      {ORBIT_DOTS.map((dot, index) => (
        <span
          key={index}
          className={cn('absolute top-1/2 left-1/2 rounded-full', dot.size, dot.color)}
          style={
            {
              '--orbit-radius': `${(variant.containerPx / 2) * dot.radiusFraction}px`,
              animation: `angkop-orbit ${dot.duration} linear infinite ${dot.reverse ? 'reverse' : 'normal'}`,
              animationDelay: dot.delay
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
