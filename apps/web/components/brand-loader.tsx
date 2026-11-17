import { cn } from '@/lib/utils'

// Angkop's loading mark: the capybara running in place, standing in for a generic spinner
// wherever the app is working on a match. Same palette tokens as BrandMark; the keyframes
// (legs, bob, ground) live in globals.css. It fades in after a short delay, so a load that
// finishes quickly never flashes it.
const SIZE_VARIANTS = {
  sm: 'w-12',
  md: 'w-20',
  lg: 'w-32'
} as const

// Hips sit at y=50 and the ground at y=74 (viewBox units). Each leg pivots from its top edge.
const LEG_PROPS = { y: 50, width: 8, height: 22, rx: 4 } as const

export function BrandLoader({
  size = 'md',
  className
}: {
  size?: keyof typeof SIZE_VARIANTS
  className?: string
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('angkop-loader angkop-loader-delay shrink-0', SIZE_VARIANTS[size], className)}
    >
      <svg viewBox="0 0 120 80" aria-hidden="true" className="block h-auto w-full">
        <g
          className="angkop-capy-ground stroke-muted-foreground opacity-40"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M10 77 L20 77 M34 77 L44 77 M58 77 L68 77 M82 77 L92 77 M106 77 L116 77 M130 77 L140 77" />
        </g>
        <g className="angkop-capy-bob">
          <g className="fill-accent-foreground">
            <rect {...LEG_PROPS} x="36" className="angkop-capy-leg angkop-capy-leg-alt" />
            <rect {...LEG_PROPS} x="76" className="angkop-capy-leg" />
          </g>
          <ellipse cx="56" cy="38" rx="36" ry="19" className="fill-primary" />
          <rect x="80" y="24" width="32" height="26" rx="12" className="fill-primary" />
          <ellipse cx="88" cy="26" rx="4" ry="3.5" className="fill-accent-foreground" />
          <ellipse cx="109" cy="33" rx="3.5" ry="3" className="fill-foreground" />
          <circle cx="97" cy="33" r="2.4" className="fill-foreground" />
          <g className="fill-primary">
            <rect {...LEG_PROPS} x="26" className="angkop-capy-leg" />
            <rect {...LEG_PROPS} x="66" className="angkop-capy-leg angkop-capy-leg-alt" />
          </g>
        </g>
      </svg>
    </div>
  )
}
