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

// The sign-in hero: BrandMark's capybara drawn large and face-on, in emerald, wearing a shirt
// collar and tie. The viewBox ends mid-chest so it rises out of the bottom edge of the viewport.
export function CapybaraHero({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 540" aria-hidden="true" className={cn('block', className)}>
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

      {/* Ears: small, and set out at the corners of the head */}
      <g className="fill-primary">
        <ellipse cx="176" cy="128" rx="26" ry="22" />
        <ellipse cx="424" cy="128" rx="26" ry="22" />
      </g>
      <g className="fill-accent-foreground">
        <ellipse cx="176" cy="130" rx="14" ry="12" />
        <ellipse cx="424" cy="130" rx="14" ry="12" />
      </g>
      <g className="fill-none stroke-background opacity-30" strokeWidth="3" strokeLinecap="round">
        <path d="M158 118 Q164 108 176 107" />
        <path d="M442 118 Q436 108 424 107" />
      </g>

      {/* Head: a tall block, flat on top and widest at the jaw, the way a capybara's is */}
      <path
        d="M300 84 C366 84 414 102 424 164 L446 296 C456 366 408 398 300 398 C192 398 144 366 154 296 L176 164 C186 102 234 84 300 84 Z"
        className="fill-primary"
      />
      {/* Light from the upper left, shade along the right side and under the jaw */}
      <path
        d="M300 84 C234 84 186 102 176 164 L154 296 C150 326 156 348 172 364 C166 338 170 312 176 280 L198 172 C208 124 244 100 300 96 Z"
        className="fill-background opacity-10"
      />
      <path
        d="M300 84 C366 84 414 102 424 164 L446 296 C450 326 444 348 428 364 C434 338 430 312 424 280 L402 172 C392 124 356 100 300 96 Z"
        className="fill-accent-foreground opacity-15"
      />
      <path
        d="M300 398 C192 398 144 366 154 296 C158 350 204 376 300 378 C396 376 442 350 446 296 C456 366 408 398 300 398 Z"
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

      {/* Blunt snout: wide-set nostrils, a cleft, a small mouth and whiskers, low on the face */}
      <ellipse cx="300" cy="322" rx="112" ry="62" className="fill-accent-foreground opacity-15" />
      <path d="M210 296 Q300 248 390 296 Q300 272 210 296 Z" className="fill-background opacity-15" />
      <g className="fill-foreground">
        <ellipse cx="270" cy="296" rx="8" ry="11" transform="rotate(-24 270 296)" />
        <ellipse cx="330" cy="296" rx="8" ry="11" transform="rotate(24 330 296)" />
      </g>
      <path
        d="M300 318 L300 338 M276 346 Q290 358 300 338 Q310 358 324 346"
        className="fill-none stroke-foreground"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M292 352 L308 352 L307 366 Q300 369 293 366 Z" className="fill-background" />
      <path d="M300 352 L300 367" className="stroke-foreground opacity-30" strokeWidth="2" />
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
    </svg>
  )
}
