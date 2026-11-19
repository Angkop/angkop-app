import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { readToken } from './read-token'

const SHOULDERS = [new THREE.Vector3(-1.05, 1.25, 0.25), new THREE.Vector3(1.05, 1.25, 0.25)]
const UP = new THREE.Vector3(0, 1, 0)

export type FoamyCapybara = {
  root: THREE.Group
  body: THREE.Mesh
  head: THREE.Group
  lids: THREE.Mesh[]
  // Puts the outfit at `index` on and the others off; any other index takes them all off.
  wear: (index: number) => void
  // Stretches an arm from its shoulder to a paw at `target` (in the capybara's own space).
  reach: (hand: number, target: THREE.Vector3) => void
  // The foam that covers an outfit change: 0 hides it, 1 is the full puff.
  puff: (amount: number) => void
}

const ellipsoid = (radii: [number, number, number], material: THREE.Material, at: [number, number, number]) => {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), material)
  mesh.scale.set(...radii)
  mesh.position.set(...at)
  return mesh
}

// A soft, round capybara in the Baymax mould: everything is a pillow, nothing has a corner. Its
// head, body and paws are ellipsoids in the palette, with a foam-white sheen along the edges,
// and it owns three outfits: one per desk on the sign-in page, which it swaps in the middle, and a
// graduation cap that only the loader (components/brand-loader.tsx) puts on.
export function buildFoamyCapybara(): FoamyCapybara {
  const primary = readToken('--primary')
  const background = readToken('--background')
  const foam = (color: THREE.Color, mix = 0) =>
    new THREE.MeshPhysicalMaterial({
      color: color.clone().lerp(background, mix),
      roughness: 0.9,
      sheen: 1,
      sheenColor: background,
      sheenRoughness: 0.7
    })
  const flat = (color: THREE.Color, roughness = 0.6) => new THREE.MeshStandardMaterial({ color, roughness })

  const coat = foam(primary, 0.06)
  const muzzle = foam(primary, 0.4)
  const belly = foam(primary, 0.5)
  const coatDeep = flat(readToken('--accent-foreground'), 0.8)
  const ink = flat(readToken('--foreground'), 0.5)
  const paper = flat(background, 0.8)
  const blush = new THREE.MeshStandardMaterial({
    color: readToken('--match-partial'),
    roughness: 0.9,
    transparent: true,
    opacity: 0.75
  })

  const root = new THREE.Group()

  // Torso, a pale belly, and two stubby feet
  const body = ellipsoid([1.2, 0.95, 0.95], coat, [0, 0.85, 0])
  root.add(body, ellipsoid([0.7, 0.62, 0.22], belly, [0, 0.8, 0.82]))
  for (const side of [-1, 1]) root.add(ellipsoid([0.34, 0.2, 0.46], coat, [side * 0.55, 0.12, 0.45]))

  // Arms are a cylinder stretched shoulder to paw, with a ball at each end so it stays round
  const arms = [0, 1].map((hand) => {
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 1, 20), coat)
    const paw = new THREE.Group()
    paw.add(ellipsoid([0.36, 0.3, 0.36], coat, [0, 0, 0]))
    for (const toe of [-1, 0, 1]) paw.add(ellipsoid([0.09, 0.08, 0.09], coatDeep, [toe * 0.17, -0.06, 0.3 - Math.abs(toe) * 0.03]))
    root.add(limb, paw, ellipsoid([0.3, 0.3, 0.3], coat, SHOULDERS[hand].toArray() as [number, number, number]))
    return { limb, paw }
  })

  // Head: a wide, soft block of a head with a round snout, sleepy eyes and a buck tooth
  const head = new THREE.Group()
  head.position.set(0, 2.0, 0.05)
  root.add(head)
  head.add(ellipsoid([1.02, 0.84, 0.9], coat, [0, 0, 0]), ellipsoid([0.56, 0.42, 0.42], muzzle, [0, -0.3, 0.74]))
  const tooth = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.13, 0.05, 3, 0.02), paper)
  tooth.position.set(0, -0.58, 1.12)
  head.add(tooth)

  const lids: THREE.Mesh[] = []
  for (const side of [-1, 1]) {
    const eye = ellipsoid([0.1, 0.1, 0.1], ink, [side * 0.55, 0.3, 0.8])
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.125, 24, 12, 0, Math.PI * 2, 0, 1.1), coat)
    lid.position.copy(eye.position)
    lid.rotation.z = side * -0.18
    lids.push(lid)

    const ear = ellipsoid([0.2, 0.17, 0.1], coat, [side * 0.8, 0.72, 0.08])
    const innerEar = ellipsoid([0.11, 0.09, 0.06], coatDeep, [side * 0.8, 0.72, 0.15])
    const nostril = ellipsoid([0.07, 0.1, 0.04], ink, [side * 0.2, -0.17, 1.13])
    nostril.rotation.z = side * 0.4
    const cheek = ellipsoid([0.17, 0.1, 0.04], blush, [side * 0.74, -0.05, 0.72])
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.026, 10, 20, Math.PI), ink)
    smile.position.set(side * 0.1, -0.5, 1.08)
    smile.rotation.z = Math.PI
    head.add(eye, lid, ear, innerEar, nostril, cheek, smile)
  }

  // Outfit 0, marketing: headphones over the ears and a lanyard with a badge
  const marketing = { head: new THREE.Group(), body: new THREE.Group() }
  const band = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.075, 12, 48, Math.PI), ink)
  band.scale.set(1, 0.92, 1)
  marketing.head.add(band)
  for (const side of [-1, 1]) {
    const cup = ellipsoid([0.2, 0.4, 0.4], ink, [side * 1.06, 0, 0])
    const pad = ellipsoid([0.06, 0.3, 0.3], flat(primary), [side * 1.2, 0, 0])
    marketing.head.add(cup, pad)
  }
  const lanyard = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.03, 8, 32, Math.PI), flat(primary))
  lanyard.position.set(0, 1.62, 0.6)
  lanyard.rotation.set(0.35, 0, Math.PI)
  const badge = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.44, 0.05, 4, 0.02), paper)
  badge.position.set(0, 1.2, 0.93)
  badge.rotation.x = -0.22
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.055), flat(primary))
  stripe.position.set(0, 1.33, 0.94)
  stripe.rotation.x = -0.22
  marketing.body.add(lanyard, badge, stripe)

  // Outfit 1, construction: a hard hat and a hi-vis vest with two reflective stripes
  const construction = { head: new THREE.Group(), body: new THREE.Group() }
  const hatColor = flat(readToken('--match-partial'), 0.45)
  const hat = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), hatColor)
  hat.scale.set(1.05, 0.78, 0.98)
  hat.position.set(0, 0.28, 0)
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.07, 40), hatColor)
  brim.scale.set(1, 1, 1.12)
  brim.position.set(0, 0.3, 0.1)
  const ridge = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.12, 1.5, 4, 0.05), hatColor)
  ridge.position.set(0, 0.99, 0)
  construction.head.add(hat, brim, ridge)

  const vestColor = readToken('--match-weak').clone().lerp(readToken('--match-partial'), 0.45)
  const vestMaterial = new THREE.MeshStandardMaterial({ color: vestColor, roughness: 0.7, side: THREE.DoubleSide })
  const vest = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0.85, 1.55), vestMaterial)
  vest.scale.set(1.225, 0.97, 0.97)
  vest.position.set(0, 0.85, 0)
  construction.body.add(vest)
  for (const offset of [0.42, 0.14, -0.14]) {
    const across = Math.sqrt(1 - (offset / 0.95) ** 2)
    const reflective = new THREE.Mesh(new THREE.TorusGeometry(1, 0.045, 8, 48), paper)
    reflective.rotation.x = Math.PI / 2
    reflective.scale.set(1.235 * across, 0.985 * across, 1)
    reflective.position.set(0, 0.85 + offset, 0)
    construction.body.add(reflective)
  }

  // Outfit 2, the fresh graduate (the loader's): a mortarboard with a tassel hanging off one corner
  const graduate = { head: new THREE.Group(), body: new THREE.Group() }
  const tassel = flat(readToken('--match-partial'), 0.6)
  const skullcap = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.62, 0.3, 32), ink)
  skullcap.position.set(0, 0.72, 0)
  const board = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.08, 1.7, 3, 0.03), ink)
  board.position.set(0, 0.92, 0)
  board.rotation.y = Math.PI / 4
  const button = ellipsoid([0.09, 0.07, 0.09], tassel, [0, 0.99, 0])
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 8), tassel)
  cord.position.set(0.55, 0.97, 0)
  cord.rotation.z = Math.PI / 2
  const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), tassel)
  strand.position.set(1.1, 0.7, 0)
  graduate.head.add(skullcap, board, button, cord, strand, ellipsoid([0.07, 0.12, 0.07], tassel, [1.1, 0.4, 0]))

  const outfits = [marketing, construction, graduate]
  for (const outfit of outfits) {
    head.add(outfit.head)
    root.add(outfit.body)
  }

  // Foam: white balls that swell around the capybara while it changes clothes
  const bubbles = Array.from({ length: 10 }, (_, index) => {
    const angle = (index / 10) * Math.PI * 2
    const bubble = ellipsoid([1, 1, 1], paper, [Math.cos(angle) * 1.75, 0.8 + (index % 4) * 0.55, Math.sin(angle) * 0.5 - 0.35])
    bubble.visible = false
    root.add(bubble)
    return { bubble, size: 0.16 + (index % 3) * 0.09 }
  })

  root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.material !== blush) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })

  const direction = new THREE.Vector3()
  return {
    root,
    body,
    head,
    lids,
    wear: (index) =>
      outfits.forEach((outfit, at) => {
        outfit.head.visible = at === index
        outfit.body.visible = at === index
      }),
    reach: (hand, target) => {
      const { limb, paw } = arms[hand]
      direction.copy(target).sub(SHOULDERS[hand])
      limb.position.copy(SHOULDERS[hand]).addScaledVector(direction, 0.5)
      limb.quaternion.setFromUnitVectors(UP, direction.clone().normalize())
      limb.scale.set(1, direction.length(), 1)
      paw.position.copy(target)
    },
    puff: (amount) =>
      bubbles.forEach(({ bubble, size }) => {
        bubble.visible = amount > 0.01
        bubble.scale.setScalar(size * amount)
      })
  }
}
