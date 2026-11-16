// The subset of the Anatomy isometric kit (https://skills.wheresryan.sh/anatomy) the sign-in
// machine uses: one fixed camera, prisms painted in four tones, and flat art laid on a face.
// World units are about 1px, x and y lie on the floor and z is up.
export type Flat = [number, number]
export type Point3 = [number, number, number]
export type Plane = [number, number]

export type Projection = {
  origin: Flat
  scale: number
}

export type Plan = {
  x: number
  y: number
  w: number
  d: number
  r: number
}

export type SolidPaths = {
  fill: string
  outline: string
  crease: string
  top: string
  shades: string[]
}

const AZIMUTH = 45
const ELEVATION = 30
const SHADES = 4
const RADIANS = Math.PI / 180
const UNIT = Math.sqrt(1.6)

const SIN_A = Math.sin(AZIMUTH * RADIANS)
const COS_A = Math.cos(AZIMUTH * RADIANS)
const SIN_E = Math.sin(ELEVATION * RADIANS)
const COS_E = Math.cos(ELEVATION * RADIANS)

export function iso([x, y, z]: Point3, { origin, scale }: Projection): Flat {
  const k = scale * UNIT
  return [origin[0] + (x * SIN_A - y * COS_A) * k, origin[1] + ((x * COS_A + y * SIN_A) * SIN_E - z * COS_E) * k]
}

// Larger means nearer the viewer; sort ascending to paint back to front.
export function depthOf([x, y, z]: Point3) {
  return (x * COS_A + y * SIN_A) * COS_E + z * SIN_E
}

const tenth = (value: number) => {
  const text = (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, '')
  return text === '-0' ? '0' : text
}

export function pathOf(points: Flat[], closed = false) {
  if (!points.length) return ''
  return points.map(([x, y], at) => `${at ? 'L' : 'M'}${tenth(x)} ${tenth(y)}`).join('') + (closed ? 'Z' : '')
}

export function roundedPlan({ x, y, w, d, r }: Plan, steps = 8): Plane[] {
  const radius = Math.max(0, Math.min(r, w / 2, d / 2))
  const corners: [number, number, number][] = [
    [x + w - radius, y + radius, -90],
    [x + w - radius, y + d - radius, 0],
    [x + radius, y + d - radius, 90],
    [x + radius, y + radius, 180]
  ]
  const out: Plane[] = []
  for (const [cx, cy, start] of corners) {
    const count = radius > 0 ? steps : 0
    for (let step = 0; step <= count; step += 1) {
      const angle = (start + (count ? (90 * step) / count : 45)) * RADIANS
      out.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)])
    }
  }
  return out
}

export function signedArea(points: Flat[]) {
  let area = 0
  for (let index = 0; index < points.length; index += 1) {
    const [ax, ay] = points[index]
    const [bx, by] = points[(index + 1) % points.length]
    area += ax * by - bx * ay
  }
  return area / 2
}

export const oriented = (points: Flat[]) => (signedArea(points) < 0 ? [...points].reverse() : points)

function convexHull(points: Flat[]): Flat[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (sorted.length < 3) return sorted
  const cross = (o: Flat, a: Flat, b: Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: Flat[] = []
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop()
    lower.push(point)
  }
  const upper: Flat[] = []
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop()
    upper.push(point)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

// Runs of consecutive indices (wrapping) whose flag equals `want`, each run closed on the
// vertex that follows it.
function runsOf(flags: boolean[], want: boolean) {
  const count = flags.length
  const runs: number[][] = []
  const start = flags.findIndex((flag, index) => flag !== flags[(index + count - 1) % count])
  if (start < 0) return flags[0] === want ? [Array.from({ length: count + 1 }, (_, index) => index % count)] : []
  let run: number[] | null = null
  for (let step = 0; step < count; step += 1) {
    const index = (start + step) % count
    if (flags[index] === want) {
      if (!run) run = [index]
      run.push((index + 1) % count)
    } else if (run) {
      runs.push(run)
      run = null
    }
  }
  if (run) runs.push(run)
  return runs
}

const shadeOf = (litness: number) => Math.min(SHADES - 1, Math.max(0, Math.floor(litness * SHADES)))

// Two matching rings, one nearer the lid than the other, joined by side faces. `facing` says
// which sides the viewer sees and `tones` which of the four tones each one takes.
function sheathe(top: Flat[], bottom: Flat[], facing: boolean[], tones: number[], convex: boolean): SolidPaths {
  const count = top.length
  const outline: string[] = []
  const crease: string[] = []
  for (const run of runsOf(facing, false)) outline.push(pathOf(run.map((index) => top[index])))
  for (const run of runsOf(facing, true)) {
    crease.push(pathOf(run.map((index) => top[index])))
    outline.push(pathOf(run.map((index) => bottom[index])))
  }
  for (let index = 0; index < count; index += 1) {
    if (facing[(index + count - 1) % count] !== facing[index]) outline.push(pathOf([top[index], bottom[index]]))
  }
  const buckets: string[][] = Array.from({ length: SHADES }, () => [])
  const sides: string[] = []
  for (let index = 0; index < count; index += 1) {
    if (!facing[index]) continue
    const next = (index + 1) % count
    const side = pathOf(oriented([top[index], top[next], bottom[next], bottom[index]]), true)
    buckets[tones[index]].push(side)
    sides.push(side)
  }
  return {
    fill: convex ? pathOf(convexHull([...top, ...bottom]), true) : pathOf(oriented(top), true) + sides.join(''),
    outline: outline.join(''),
    crease: crease.join(''),
    top: pathOf(oriented(top), true),
    shades: buckets.map((paths) => paths.join(''))
  }
}

// Any floor outline stood up into a prism.
export function extrude(ring: Plane[], z: number, height: number, projection: Projection): SolidPaths {
  const count = ring.length
  const counter = signedArea(ring) > 0
  const normals = ring.map(([ax, ay], index) => {
    const [bx, by] = ring[(index + 1) % count]
    const length = Math.hypot(bx - ax, by - ay) || 1
    const dx = (bx - ax) / length
    const dy = (by - ay) / length
    return (counter ? [dy, -dx] : [-dy, dx]) as Plane
  })
  return sheathe(
    ring.map(([x, y]) => iso([x, y, z + height], projection)),
    ring.map(([x, y]) => iso([x, y, z], projection)),
    normals.map(([nx, ny]) => nx * COS_A + ny * SIN_A > 1e-9),
    normals.map(([nx, ny]) => shadeOf((nx * -SIN_A + ny * COS_A + 1) / 2)),
    true
  )
}

// A flat cut-out stood on edge and given thickness along y, like a cardboard standee. `outline`
// is in the art's own units (x along the face, y down); its top-left corner sits at
// (`x`, `top`) and the face looks toward +y, with the back `depth` further toward -y.
export function standeeOf(outline: Flat[], [x, top]: Plane, scale: number, y: number, depth: number, projection: Projection): SolidPaths {
  const count = outline.length
  const at = (point: Flat, plane: number): Flat => iso([x + point[0] * scale, plane, top - point[1] * scale], projection)
  const counter = signedArea(outline.map(([ax, ay]) => [ax, -ay] as Flat)) > 0
  const normals = outline.map(([ax, ay], index) => {
    const [bx, by] = outline[(index + 1) % count]
    const length = Math.hypot(bx - ax, by - ay) || 1
    const dx = (bx - ax) / length
    const dz = -(by - ay) / length
    return (counter ? [dz, -dx] : [-dz, dx]) as Plane
  })
  return sheathe(
    outline.map((point) => at(point, y)),
    outline.map((point) => at(point, y - depth)),
    normals.map(([nx, nz]) => nx * COS_A * COS_E + nz * SIN_E > 1e-9),
    normals.map(([nx, nz]) => (nz > 0.5 ? SHADES - 1 : shadeOf((nx * -SIN_A + 1) / 2))),
    false
  )
}

export const slabOf = (plan: Plan, z: number, height: number, projection: Projection, steps = 6) =>
  extrude(roundedPlan(plan, steps), z, height, projection)

export function circleRing(cx: number, cy: number, radius: number, steps = 32): Plane[] {
  return Array.from({ length: steps }, (_, step) => {
    const angle = (step / steps) * Math.PI * 2
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)] as Plane
  })
}

export const cylinder = (cx: number, cy: number, radius: number, z: number, height: number, projection: Projection, steps = 24) =>
  extrude(circleRing(cx, cy, radius, steps), z, height, projection)

export const insetPlan = ({ x, y, w, d, r }: Plan, by: number): Plan => ({
  x: x + by,
  y: y + by,
  w: w - by * 2,
  d: d - by * 2,
  r: Math.max(0, r - by)
})

export const onTop = (points: Plane[], z: number, projection: Projection, closed = false) =>
  pathOf(
    points.map(([x, y]) => iso([x, y, z], projection)),
    closed
  )

export const planOutline = (plan: Plan, z: number, projection: Projection) => onTop(roundedPlan(plan, 6), z, projection, true)

export const segment = (from: Point3, to: Point3, projection: Projection) =>
  pathOf([iso(from, projection), iso(to, projection)])

export const pointsAt = (points: Point3[], projection: Projection): Flat[] => points.map((point) => iso(point, projection))

// The screen offset of a world move, for a pre-built group that slides along a rail.
export function translateAlong(projection: Projection, [dx, dy, dz]: Point3) {
  const origin = iso([0, 0, 0], projection)
  const moved = iso([dx, dy, dz], projection)
  return `translate(${Math.round((moved[0] - origin[0]) * 100) / 100} ${Math.round((moved[1] - origin[1]) * 100) / 100})`
}

const thousandth = (value: number) => Math.round(value * 1000) / 1000

// Lays flat art (x along the face, y down) on the visible face of a vertical plane whose
// normal is +y ('left', in screen terms) or +x ('right'), with its top-left corner at `at`.
export function sideMatrix([x, y]: Plane, z: number, projection: Projection, face: 'left' | 'right') {
  const origin = iso([x, y, z], projection)
  const along = (point: Point3): Flat => {
    const [px, py] = iso(point, projection)
    return [px - origin[0], py - origin[1]]
  }
  const ux = along([x + 1, y, z])
  const uy = along([x, y + 1, z])
  const uz = along([x, y, z + 1])
  const down: Flat = [-uz[0], -uz[1]]
  const [u, v]: [Flat, Flat] = face === 'left' ? [ux, down] : [[-uy[0], -uy[1]], down]
  return `matrix(${thousandth(u[0])} ${thousandth(u[1])} ${thousandth(v[0])} ${thousandth(v[1])} ${thousandth(origin[0])} ${thousandth(origin[1])})`
}

export function fitProjection(points: Point3[], width: number, height: number, pad = 16): Projection {
  const unit: Projection = { origin: [0, 0], scale: 1 }
  const flat = points.map((point) => iso(point, unit))
  const xs = flat.map(([x]) => x)
  const ys = flat.map(([, y]) => y)
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const up = Math.min(...ys)
  const down = Math.max(...ys)
  const scale = Math.min((width - pad * 2) / (right - left), (height - pad * 2) / (down - up))
  return {
    origin: [width / 2 - ((left + right) / 2) * scale, height / 2 - ((up + down) / 2) * scale],
    scale
  }
}
