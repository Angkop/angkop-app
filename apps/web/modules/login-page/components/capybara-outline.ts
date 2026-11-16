import type { Flat } from '@/components/iso/iso-kit'

type Cubic = [Flat, Flat, Flat, Flat]

// Points along a cubic Bezier, `from` and `to` being shares of the curve.
function sample([p0, p1, p2, p3]: Cubic, steps: number, from = 0, to = 1): Flat[] {
  return Array.from({ length: steps + 1 }, (_, step) => {
    const t = from + ((to - from) * step) / steps
    const u = 1 - t
    const mix = (axis: 0 | 1) =>
      u * u * u * p0[axis] + 3 * u * u * t * p1[axis] + 3 * u * t * t * p2[axis] + t * t * t * p3[axis]
    return [mix(0), mix(1)] as Flat
  })
}

const mirror = ([x, y]: Flat): Flat => [600 - x, y]

// The left shoulder curve of CapybaraHero, up to where the head's jaw meets it.
const SHOULDER = sample([[20, 540], [20, 430], [96, 356], [200, 346]], 10).filter(([x]) => x <= 160)

// Head, ear and top edge up the left side, in the 600 x 540 box of CapybaraHero.
const LEFT_SIDE: Flat[] = [
  [160, 346],
  [154, 296],
  [176, 164],
  [178, 150],
  [160, 146],
  [151, 134],
  [150, 122],
  [157, 111],
  [170, 106],
  [186, 106],
  [197, 103],
  ...sample([[176, 164], [186, 102], [234, 84], [300, 84]], 6, 0.58, 1).slice(0, -1)
]

// The silhouette of CapybaraHero (head, ears and shoulders) as a clockwise polygon in its own
// units, for the standee the machine's capybara is cut from. The bottom edge sits at the
// bottom of the 600 x 540 box.
export const CAPYBARA_OUTLINE: Flat[] = [
  ...SHOULDER,
  ...LEFT_SIDE,
  [300, 84],
  ...[...SHOULDER, ...LEFT_SIDE].reverse().map(mirror)
]
