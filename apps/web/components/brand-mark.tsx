import { cn } from '@/lib/utils'

// Angkop's beaver mark, filled from the globals.css tokens so it follows the palette. Same
// drawing as app/icon.svg (the favicon), which has to hardcode its colors instead; the sign-in hero
// (modules/login-page) is the large version.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={cn('size-7 shrink-0', className)}>
      <rect width="120" height="120" rx="28" className="fill-primary" />
      <g transform="translate(60 120) scale(1.2) translate(-60 -120)">
      <g className="fill-accent">
        <ellipse cx="28" cy="58" rx="8" ry="7" />
        <ellipse cx="92" cy="58" rx="8" ry="7" />
        <path d="M60 44 C80 44 92 50 95 66 L101 100 C103 112 100 120 100 120 L20 120 C20 120 17 112 19 100 L25 66 C28 50 40 44 60 44 Z" />
      </g>
      <ellipse cx="60" cy="110" rx="30" ry="16" className="fill-accent-foreground opacity-15" />
      <g className="fill-foreground">
        <path d="M33 76 A6 6 0 0 0 45 76 Z" />
        <path d="M75 76 A6 6 0 0 0 87 76 Z" />
        <ellipse cx="60" cy="93" rx="10" ry="7" />
      </g>
      <g className="fill-background stroke-foreground" strokeWidth="1.6" strokeLinejoin="round">
        <rect x="52.5" y="101" width="7.5" height="15" rx="2.5" />
        <rect x="60" y="101" width="7.5" height="15" rx="2.5" />
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
