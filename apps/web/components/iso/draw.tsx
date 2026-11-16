import type { ReactNode } from 'react'
import type { Flat, SolidPaths } from './iso-kit'

export type Tone = 'hi' | 'mid' | 'lo' | 'faint'
export type LineTone = Tone | 'lit' | 'green'

// A solid, painted in the kit's order: paper, the four side tones, the lid, the crease, then
// whatever sits on it (`inner`), then the silhouette.
export function Solid({
  paths,
  tone = 'hi',
  lit = false,
  halo = false,
  className,
  inner,
  children
}: {
  paths: SolidPaths
  tone?: Tone
  lit?: boolean
  halo?: boolean
  className?: string
  inner?: ReactNode
  children?: ReactNode
}) {
  return (
    <g className={className ? `iso-solid ${className}` : 'iso-solid'} data-lit={lit ? '' : undefined}>
      {halo && <path className="iso-halo" d={paths.fill} />}
      <path className="iso-fill" d={paths.fill} />
      {paths.shades.map((d, shade) => d && <path key={shade} className="iso-shade" data-shade={shade} d={d} />)}
      <path className="iso-top" d={paths.top} />
      {paths.crease && <path className="iso-line iso-crease" data-tone="faint" d={paths.crease} />}
      {inner}
      <path className="iso-line iso-edge" data-tone={tone} d={paths.outline} />
      {children}
    </g>
  )
}

export function Line({ d, tone = 'lo' }: { d: string; tone?: LineTone }) {
  return d ? <path className="iso-line" data-tone={tone} d={d} /> : null
}

export function Dots({ points, size = 0.5 }: { points: Flat[]; size?: number }) {
  return (
    <g className="iso-dots">
      {points.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={size} />
      ))}
    </g>
  )
}
