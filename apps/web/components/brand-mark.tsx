import { cn } from '@/lib/utils'

// Angkop's capybara mark, filled from the globals.css tokens so it follows the palette. Same
// drawing as app/icon.svg (the favicon), which has to hardcode its colors instead; the sign-in hero
// (modules/login-page) is the large version.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={cn('size-7 shrink-0', className)}>
      <rect width="120" height="120" rx="28" className="fill-primary" />
      <g transform="translate(60 120) scale(1.2) translate(-60 -120)">
      <g className="fill-accent">
        <ellipse cx="27" cy="58" rx="9" ry="8" />
        <ellipse cx="93" cy="58" rx="9" ry="8" />
        <path d="M60 44 C80 44 92 50 95 66 L101 100 C103 112 100 120 100 120 L20 120 C20 120 17 112 19 100 L25 66 C28 50 40 44 60 44 Z" />
      </g>
      <ellipse cx="60" cy="110" rx="30" ry="16" className="fill-accent-foreground opacity-15" />
      <g className="fill-foreground">
        <path d="M33 76 A6 6 0 0 0 45 76 Z" />
        <path d="M75 76 A6 6 0 0 0 87 76 Z" />
        <ellipse cx="52" cy="103" rx="3" ry="4" transform="rotate(-24 52 103)" />
        <ellipse cx="68" cy="103" rx="3" ry="4" transform="rotate(24 68 103)" />
      </g>
      <path
        d="M31 77 L47 75 M73 75 L89 77"
        className="fill-none stroke-foreground"
        strokeWidth="3"
        strokeLinecap="round"
      />
      </g>
    </svg>
  )
}
