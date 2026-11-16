import {
  circleRing,
  cylinder,
  fitProjection,
  insetPlan,
  iso,
  onTop,
  pathOf,
  planOutline,
  pointsAt,
  sideMatrix,
  slabOf,
  standeeOf,
  translateAlong,
  type Flat,
  type Plan,
  type Point3,
  type SolidPaths
} from '@/components/iso/iso-kit'
import { CAPYBARA_OUTLINE } from './capybara-outline'
import { KEY_COLUMNS, KEY_ROWS, type Hand, type Press } from './workstation-model'

// A desk with the capybara behind it: a monitor on the left, a keyboard in front of the
// capybara and a mug. World units are about 1px; x runs toward the lower right, y toward the
// lower left, z is up.
export const VIEW = { width: 640, height: 560 }

const FLOOR = 18
const DESK_TOP = 58
const BASE: Plan = { x: 0, y: 10, w: 470, d: 180, r: 8 }
const DESK: Plan = { x: 6, y: 64, w: 458, d: 112, r: 4 }

// The capybara is a cut-out of CapybaraHero stood on the base behind the desk, its face looking
// toward +y. Its art box is 600 x 540 units, drawn at 0.4 world units per unit.
const STANDEE = { x: 232, top: 234, y: 46, depth: 30, scale: 0.4 }

const PROJECTION = fitProjection(
  [
    [0, 10, 0],
    [470, 10, 0],
    [0, 190, 0],
    [470, 190, 0],
    [240, 16, 206],
    [464, 16, 206],
    [8, 104, 184]
  ],
  VIEW.width,
  VIEW.height
)
const PIXEL = PROJECTION.scale * Math.sqrt(1.6)

// A solid with a point inside it, to paint it in depth order beside the others.
export type Part = { at: Point3; paths: SolidPaths }

const part = (plan: Plan, z0: number, z1: number, steps = 3): Part => ({
  at: [plan.x + plan.w / 2, plan.y + plan.d / 2, (z0 + z1) / 2],
  paths: slabOf(plan, z0, z1 - z0, PROJECTION, steps)
})
const post = (cx: number, cy: number, radius: number, z0: number, z1: number): Part => ({
  at: [cx, cy, (z0 + z1) / 2],
  paths: cylinder(cx, cy, radius, z0, z1 - z0, PROJECTION, 24)
})
const dots = (points: Point3[]) => pointsAt(points, PROJECTION)

// --- The base the desk and the capybara stand on ---------------------------------------------
export const BASE_ART = {
  halo: slabOf(BASE, 6, FLOOR - 6, PROJECTION, 6).fill,
  feet: [
    [16, 26],
    [454, 26],
    [16, 176],
    [454, 176]
  ].map(([x, y]) => post(x, y, 7, 0, 6).paths),
  plate: slabOf(BASE, 6, FLOOR - 6, PROJECTION, 6),
  groove: planOutline(insetPlan(BASE, 6), FLOOR, PROJECTION),
  screws: dots(
    [
      [12, 22],
      [458, 22],
      [12, 178],
      [458, 178]
    ].map(([x, y]) => [x, y, FLOOR] as Point3)
  )
}

// --- The capybara ----------------------------------------------------------------------------
export const CAPYBARA_ART = {
  standee: standeeOf(CAPYBARA_OUTLINE, [STANDEE.x, STANDEE.top], STANDEE.scale, STANDEE.y, STANDEE.depth, PROJECTION),
  // Puts CapybaraHero's 600 x 540 drawing on the standee's front face.
  face: `${sideMatrix([STANDEE.x, STANDEE.y], STANDEE.top, PROJECTION, 'left')} scale(${STANDEE.scale})`
}

// --- The desk: a cabinet with three drawers on its front face (the plane y = 176) -------------
const DESK_FRONT = DESK.y + DESK.d
const frontRect = (x0: number, x1: number, z0: number, z1: number) =>
  pathOf(
    [
      [x0, z0],
      [x1, z0],
      [x1, z1],
      [x0, z1]
    ].map(([x, z]) => iso([x, DESK_FRONT, z], PROJECTION)),
    true
  )

const DRAWERS = [
  [22, 150],
  [162, 290],
  [302, 448]
]

export const DESK_ART = {
  cabinet: part(DESK, FLOOR, DESK_TOP, 4),
  drawers: DRAWERS.map(([x0, x1]) => frontRect(x0, x1, 24, 52)),
  handles: DRAWERS.map(([x0, x1]) => {
    const middle = (x0 + x1) / 2
    return pathOf([iso([middle - 10, DESK_FRONT, 44], PROJECTION), iso([middle + 10, DESK_FRONT, 44], PROJECTION)])
  })
}

// --- The monitor, whose screen is the plane y = 116 -------------------------------------------
const MONITOR: Plan = { x: 8, y: 104, w: 172, d: 12, r: 3 }
const MONITOR_FRONT = MONITOR.y + MONITOR.d
const BEZEL = 7
const MONITOR_Z = { bottom: 70, top: 182 }

export const MONITOR_ART = {
  stand: part({ x: 68, y: 92, w: 52, d: 34, r: 8 }, DESK_TOP, DESK_TOP + 3),
  neck: part({ x: 87, y: 106, w: 14, d: 8, r: 2 }, DESK_TOP + 3, MONITOR_Z.bottom),
  housing: part(MONITOR, MONITOR_Z.bottom, MONITOR_Z.top),
  led: dots([[MONITOR.x + MONITOR.w / 2, MONITOR_FRONT, MONITOR_Z.bottom + 5]]),
  // The screen's own box, in world units (x along the face, y down), laid on the housing's front.
  screen: {
    matrix: sideMatrix([MONITOR.x + BEZEL, MONITOR_FRONT], MONITOR_Z.top - BEZEL, PROJECTION, 'left'),
    width: MONITOR.w - BEZEL * 2,
    height: MONITOR_Z.top - MONITOR_Z.bottom - BEZEL - 12
  }
}

// --- The keyboard: three rows of nine keys ---------------------------------------------------
const KEY = { x: 296, y: 102, size: 9, pitch: 11, bottom: DESK_TOP + 4, top: DESK_TOP + 7 }

export const KEYBOARD_ART = {
  board: part({ x: 290, y: 98, w: 112, d: 40, r: 4 }, DESK_TOP, DESK_TOP + 4),
  keys: Array.from({ length: KEY_ROWS * KEY_COLUMNS }, (_, index): Part => {
    const row = Math.floor(index / KEY_COLUMNS)
    const column = index % KEY_COLUMNS
    return part(
      { x: KEY.x + column * KEY.pitch, y: KEY.y + row * KEY.pitch, w: KEY.size, d: KEY.size, r: 1.5 },
      KEY.bottom,
      KEY.top,
      2
    )
  }),
  // A key goes down by up to 1.8 units as `depth` goes 0 to 1.
  depress: (depth: number) => translateAlong(PROJECTION, [0, 0, -1.8 * depth])
}

// --- The mug ---------------------------------------------------------------------------------
export const MUG_ART = {
  body: post(430, 150, 8, DESK_TOP, DESK_TOP + 16),
  rim: onTop(circleRing(430, 150, 6, 24), DESK_TOP + 16, PROJECTION, true)
}

// --- The capybara's arms and paws -------------------------------------------------------------
const SHOULDERS: Record<Hand, Point3> = { left: [284, 46, 66], right: [420, 46, 66] }
const REST: Record<Hand, Point3> = { left: [318, 118, KEY.top + 4], right: [372, 118, KEY.top + 4] }

export const toScreen = (point: Point3): Flat => iso(point, PROJECTION)

// Where a paw wants to be: resting above the keys, or on the key that is being struck.
export function pawTarget(hand: Hand, press: Press | null): Point3 {
  if (!press || press.hand !== hand) return REST[hand]
  return [
    KEY.x + press.column * KEY.pitch + KEY.size / 2,
    KEY.y + press.row * KEY.pitch + KEY.size / 2,
    KEY.top + 4 - 1.8 * press.depth
  ]
}

export const armPath = (hand: Hand, paw: Flat) => pathOf([toScreen(SHOULDERS[hand]), paw])

export const LIMB = {
  armWidth: 10 * PIXEL,
  pawRadius: 6.5 * PIXEL,
  rest: REST
}
