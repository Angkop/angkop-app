'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { Dots, Line, Solid } from '@/components/iso/draw'
import { depthOf, type Point3 } from '@/components/iso/iso-kit'
import '@/components/iso/iso.css'
import { cn } from '@/lib/utils'
import { CapybaraArt } from './capybara-hero'
import {
  BASE_ART,
  CAPYBARA_ART,
  DESK_ART,
  KEYBOARD_ART,
  LIMB,
  MONITOR_ART,
  MUG_ART,
  VIEW,
  armPath,
  pawTarget,
  toScreen,
  type Part
} from './workstation-geometry'
import { SETTLED_POSE, poseAt, type DeskPose, type Hand } from './workstation-model'

const HANDS: Hand[] = ['left', 'right']

type Item = { key: string; at: Point3; node: ReactNode }

const byDepth = (items: Item[]) => [...items].sort((a, b) => depthOf(a.at) - depthOf(b.at))
const solid = (key: string, { at, paths }: Part, children?: ReactNode): Item => ({
  key,
  at,
  node: <Solid paths={paths}>{children}</Solid>
})

// Keys are painted back to front, so the nearer ones sit over the ones behind.
const KEY_ORDER = KEYBOARD_ART.keys
  .map((key, index) => ({ index, depth: depthOf(key.at) }))
  .sort((a, b) => a.depth - b.depth)
  .map(({ index }) => index)

// Three toes pointing toward the viewer, on a paw drawn about its own centre.
const PAW = LIMB.pawRadius
const TOES = [-1, 0, 1].map((side) => `M${side * PAW * 0.45 - PAW * 0.1} ${PAW * 0.2}L${side * PAW * 0.55 - PAW * 0.3} ${PAW * 0.85}`).join('')

const SCREEN_INNER = 142
const REST = poseAt(0)

// The sign-in hero: the capybara at a desk, typing a profile into the monitor beside it. Each
// character is struck on its own key (the keys go down, the paws follow), and on enter the screen
// shows the job that profile matches and how strongly, the same three examples as before. The art
// is static SVG; only the keys, paws, arms and screen text are written to, each frame, through
// refs. Reduced motion gets the answered screen.
export function Workstation({ className }: { className?: string }) {
  const keys = useRef<(SVGGElement | null)[]>([])
  const paws = useRef<Record<Hand, SVGGElement | null>>({ left: null, right: null })
  const armEdges = useRef<Record<Hand, SVGPathElement | null>>({ left: null, right: null })
  const armFills = useRef<Record<Hand, SVGPathElement | null>>({ left: null, right: null })
  const content = useRef<SVGGElement>(null)
  const typed = useRef<SVGTextElement>(null)
  const result = useRef<SVGGElement>(null)
  const job = useRef<SVGTextElement>(null)
  const score = useRef<SVGTextElement>(null)
  const bar = useRef<SVGRectElement>(null)

  useEffect(() => {
    const position: Record<Hand, Point3> = {
      left: [...pawTarget('left', null)],
      right: [...pawTarget('right', null)]
    }
    let pressed = -1

    const apply = (pose: DeskPose, follow: number) => {
      // Screen
      content.current?.setAttribute('opacity', String(pose.fade))
      result.current?.setAttribute('opacity', String(pose.result))
      if (typed.current && typed.current.textContent !== pose.typed) typed.current.textContent = pose.typed
      if (job.current && job.current.textContent !== pose.example.job) job.current.textContent = pose.example.job
      const percent = `${Math.round(pose.reading * 100)}%`
      if (score.current && score.current.textContent !== percent) score.current.textContent = percent
      bar.current?.setAttribute('width', String(SCREEN_INNER * pose.reading))

      // Keys: the one being struck goes down, the previous one comes back up
      const next = pose.press ? pose.press.row * 9 + pose.press.column : -1
      if (pressed >= 0 && pressed !== next) keys.current[pressed]?.removeAttribute('transform')
      if (next >= 0 && pose.press) keys.current[next]?.setAttribute('transform', KEYBOARD_ART.depress(pose.press.depth))
      pressed = next

      // Paws follow their targets; each arm runs from its shoulder to its paw
      for (const hand of HANDS) {
        const target = pawTarget(hand, pose.press)
        const current = position[hand]
        for (let axis = 0; axis < 3; axis += 1) current[axis] += (target[axis] - current[axis]) * follow
        const [x, y] = toScreen(current)
        paws.current[hand]?.setAttribute('transform', `translate(${x} ${y})`)
        const arm = armPath(hand, [x, y])
        armEdges.current[hand]?.setAttribute('d', arm)
        armFills.current[hand]?.setAttribute('d', arm)
      }
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      apply(SETTLED_POSE, 1)
      return
    }

    const start = performance.now()
    let last = start
    let frame = 0
    const tick = (now: number) => {
      apply(poseAt((now - start) / 1000), Math.min(1, ((now - last) / 1000) * 16))
      last = now
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const onDesk = byDepth([
    solid('stand', MONITOR_ART.stand),
    solid('neck', MONITOR_ART.neck),
    solid(
      'monitor',
      MONITOR_ART.housing,
      <>
        <Dots points={MONITOR_ART.led} size={0.9} />
        <g transform={MONITOR_ART.screen.matrix}>
          <rect className="fill-foreground" width={MONITOR_ART.screen.width} height={MONITOR_ART.screen.height} rx={3} />
          <text x={8} y={12} fontSize={6.5} className="fill-background opacity-60">
            Meaning, not keywords
          </text>
          <g ref={content}>
            <text ref={typed} x={8} y={30} fontSize={10} className="fill-background font-semibold" />
            <g ref={result} opacity={REST.result}>
              <text x={8} y={42} fontSize={6.5} className="fill-match-weak">
                Keyword search: no results
              </text>
              <text x={8} y={54} fontSize={8} className="fill-background opacity-50">
                ↓
              </text>
              <text ref={job} x={8} y={68} fontSize={10.5} className="fill-primary font-semibold" />
              <text x={8} y={82} fontSize={6.5} className="fill-background opacity-70">
                Angkop match
              </text>
              <text ref={score} x={150} y={82} fontSize={9} textAnchor="end" className="fill-primary font-semibold" />
              <rect x={8} y={86} width={SCREEN_INNER} height={3} rx={1.5} className="fill-background opacity-20" />
              <rect ref={bar} x={8} y={86} width={0} height={3} rx={1.5} className="fill-primary" />
            </g>
          </g>
        </g>
      </>
    ),
    solid('keyboard', KEYBOARD_ART.board),
    solid('mug', MUG_ART.body, <Line d={MUG_ART.rim} tone="mid" />)
  ])

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      role="img"
      aria-label="A capybara at a desk types a job seeker's profile on a keyboard. The monitor beside it shows the profile, then a differently worded job that matches it, and how strong the match is."
      className={cn('angkop-iso w-full', className)}
    >
      <path className="iso-halo" d={BASE_ART.halo} />
      {BASE_ART.feet.map((paths, index) => (
        <Solid key={index} paths={paths} tone="lo" />
      ))}
      <Solid paths={BASE_ART.plate} tone="mid">
        <Line d={BASE_ART.groove} tone="faint" />
        <Dots points={BASE_ART.screws} />
      </Solid>

      <Solid paths={CAPYBARA_ART.standee} className="iso-coat" />
      <g transform={CAPYBARA_ART.face}>
        <CapybaraArt />
      </g>

      <Solid paths={DESK_ART.cabinet.paths} tone="mid">
        {DESK_ART.drawers.map((d) => (
          <Line key={d} d={d} tone="faint" />
        ))}
        {DESK_ART.handles.map((d) => (
          <Line key={d} d={d} tone="mid" />
        ))}
      </Solid>

      {onDesk.map((item) => (
        <g key={item.key}>{item.node}</g>
      ))}

      {KEY_ORDER.map((index) => (
        <g
          key={index}
          ref={(element) => {
            keys.current[index] = element
          }}
        >
          <Solid paths={KEYBOARD_ART.keys[index].paths} tone="lo" />
        </g>
      ))}

      {HANDS.map((hand) => (
        <g key={hand}>
          <path
            ref={(element) => {
              armEdges.current[hand] = element
            }}
            className="iso-limb-edge"
            strokeWidth={LIMB.armWidth + 1.6}
            d={armPath(hand, toScreen(pawTarget(hand, null)))}
          />
          <path
            ref={(element) => {
              armFills.current[hand] = element
            }}
            className="iso-limb"
            strokeWidth={LIMB.armWidth}
            d={armPath(hand, toScreen(pawTarget(hand, null)))}
          />
        </g>
      ))}
      {HANDS.map((hand) => (
        <g
          key={hand}
          ref={(element) => {
            paws.current[hand] = element
          }}
          transform={`translate(${toScreen(pawTarget(hand, null)).join(' ')})`}
        >
          <ellipse className="iso-paw" rx={PAW * 1.15} ry={PAW * 0.85} />
          <path className="iso-toe" strokeWidth={PAW * 0.14} d={TOES} />
        </g>
      ))}
    </svg>
  )
}
