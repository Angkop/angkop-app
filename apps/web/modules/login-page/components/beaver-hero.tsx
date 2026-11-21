import { cn } from '@/lib/utils'

// Coarse coat: short tufts across the forehead, cheeks and shoulders.
const FUR_TUFTS = [
  'M236 128 q8 -9 18 -6',
  'M286 142 q8 -9 18 -6',
  'M340 128 q8 -9 18 -6',
  'M262 172 q8 -9 18 -6',
  'M318 172 q8 -9 18 -6',
  'M188 290 q6 -9 16 -8',
  'M396 282 q10 -1 16 8',
  'M176 330 q6 -9 16 -8',
  'M408 322 q10 -1 16 8',
  'M96 430 q8 -10 20 -8',
  'M148 400 q8 -10 20 -8',
  'M132 470 q8 -10 20 -8',
  'M70 490 q8 -10 20 -8',
  'M432 392 q12 -2 20 8',
  'M484 422 q12 -2 20 8',
  'M448 462 q12 -2 20 8',
  'M510 482 q12 -2 20 8'
]

// The sign-in hero: BrandMark's beaver drawn large and face-on, in emerald, wearing a shirt
// collar and tie. The viewBox ends mid-chest so it rises out of the bottom edge of the viewport.
export function BeaverHero({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 540" aria-hidden="true" className={cn('block', className)}>
      <BeaverArt />
    </svg>
  )
}

// The drawing itself, in a 600 x 540 box, so MatcherMachine can lay it on a face of its standee.
export function BeaverArt() {
  return (
    <>
      {/* Shoulders, darker than the head, with the shadow the head casts on them */}
      <path d="M20 540 C20 430 96 356 200 346 L400 346 C504 356 580 430 580 540 Z" className="fill-primary" />
      <path
        d="M20 540 C20 430 96 356 200 346 L400 346 C504 356 580 430 580 540 Z"
        className="fill-accent-foreground opacity-20"
      />
      <ellipse cx="300" cy="402" rx="170" ry="34" className="fill-accent-foreground opacity-25" />

      {/* Shirt collar, placket and a striped tie */}
      <path d="M262 452 L300 398 L338 452 L330 540 L270 540 Z" className="fill-background" />
      <path d="M214 372 L300 398 L262 452 Z" className="fill-background" />
      <path d="M386 372 L300 398 L338 452 Z" className="fill-background" />
      <path
        d="M214 372 L262 452 L300 398 M386 372 L338 452 L300 398"
        className="fill-none stroke-foreground opacity-15"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M288 426 L312 426 L332 540 L268 540 Z" className="fill-foreground" />
      <g className="fill-none stroke-primary" strokeWidth="7">
        <path d="M284 452 L316 440" />
        <path d="M279 484 L322 468" />
        <path d="M274 516 L327 496" />
      </g>
      <path d="M280 390 L320 390 L313 426 L287 426 Z" className="fill-foreground" />
      <path d="M287 426 L313 426 L311 434 L289 434 Z" className="fill-background opacity-20" />

      {/* Ears: small and round, tucked into the sides of the head */}
      <g className="fill-primary">
        <ellipse cx="184" cy="128" rx="22" ry="20" />
        <ellipse cx="416" cy="128" rx="22" ry="20" />
      </g>
      <g className="fill-accent-foreground">
        <ellipse cx="184" cy="130" rx="12" ry="11" />
        <ellipse cx="416" cy="130" rx="12" ry="11" />
      </g>
      <g className="fill-none stroke-background opacity-30" strokeWidth="3" strokeLinecap="round">
        <path d="M168 120 Q173 110 184 109" />
        <path d="M432 120 Q427 110 416 109" />
      </g>

      {/* Head: broad and round, with full cheeks, the way a beaver's is */}
      <path
        d="M300 84 C380 84 436 128 444 206 L450 296 C454 366 408 398 300 398 C192 398 146 366 150 296 L156 206 C164 128 220 84 300 84 Z"
        className="fill-primary"
      />
      {/* Light from the upper left, shade along the right side and under the jaw */}
      <path
        d="M300 84 C220 84 164 128 156 206 L150 296 C148 326 154 348 172 364 C166 338 168 312 174 280 L192 206 C200 136 244 100 300 96 Z"
        className="fill-background opacity-10"
      />
      <path
        d="M300 84 C380 84 436 128 444 206 L450 296 C452 326 446 348 428 364 C434 338 432 312 426 280 L408 206 C400 136 356 100 300 96 Z"
        className="fill-accent-foreground opacity-15"
      />
      <path
        d="M300 398 C192 398 146 366 150 296 C156 350 204 376 300 378 C396 376 444 350 450 296 C454 366 408 398 300 398 Z"
        className="fill-accent-foreground opacity-25"
      />

      <g className="fill-none stroke-accent-foreground opacity-30" strokeWidth="4" strokeLinecap="round">
        {FUR_TUFTS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>

      {/* Eyes: small, set high and wide, half-closed and unbothered, under heavy lids */}
      <g className="fill-accent-foreground opacity-20">
        <ellipse cx="212" cy="190" rx="30" ry="16" />
        <ellipse cx="388" cy="190" rx="30" ry="16" />
      </g>
      <g className="angkop-blink">
        <path d="M197 196 A15 15 0 0 0 227 196 Z" className="fill-foreground" />
        <path d="M373 196 A15 15 0 0 0 403 196 Z" className="fill-foreground" />
        <g className="fill-background">
          <circle cx="218" cy="201" r="3" />
          <circle cx="394" cy="201" r="3" />
        </g>
        <path
          d="M192 199 L232 194 M368 194 L408 199"
          className="fill-none stroke-foreground"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
      <g className="fill-none stroke-foreground opacity-50" strokeWidth="4" strokeLinecap="round">
        <path d="M194 174 Q212 166 232 172" />
        <path d="M368 172 Q388 166 406 174" />
      </g>
      <g className="fill-match-partial opacity-45">
        <ellipse cx="196" cy="246" rx="20" ry="11" />
        <ellipse cx="404" cy="246" rx="20" ry="11" />
      </g>

      {/* Snout: a pale muzzle pad, a big round nose, and two buck teeth hanging past the mouth */}
      <ellipse cx="300" cy="322" rx="104" ry="68" className="fill-background opacity-25" />
      <ellipse cx="300" cy="322" rx="104" ry="68" className="fill-accent-foreground opacity-10" />
      <ellipse cx="300" cy="290" rx="36" ry="24" className="fill-foreground" />
      <ellipse cx="289" cy="282" rx="10" ry="6" className="fill-background opacity-30" />
      <path
        d="M300 314 L300 334 M270 340 Q286 354 300 334 Q314 354 330 340"
        className="fill-none stroke-foreground"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g className="fill-background stroke-foreground" strokeWidth="2.5" strokeLinejoin="round">
        <rect x="280" y="344" width="20" height="38" rx="5" />
        <rect x="300" y="344" width="20" height="38" rx="5" />
      </g>
      <g className="fill-accent-foreground opacity-50">
        <circle cx="236" cy="322" r="3" />
        <circle cx="248" cy="336" r="3" />
        <circle cx="228" cy="340" r="3" />
        <circle cx="364" cy="322" r="3" />
        <circle cx="352" cy="336" r="3" />
        <circle cx="372" cy="340" r="3" />
      </g>
      <g className="fill-none stroke-foreground opacity-35" strokeWidth="2.5" strokeLinecap="round">
        <path d="M222 326 L150 312" />
        <path d="M220 338 L146 340" />
        <path d="M224 350 L156 368" />
        <path d="M378 326 L450 312" />
        <path d="M380 338 L454 340" />
        <path d="M376 350 L444 368" />
      </g>
    </>
  )
}
