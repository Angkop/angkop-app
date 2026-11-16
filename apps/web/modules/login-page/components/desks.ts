import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { readToken } from './read-token'

// World height of a desk top, and the depth the capybara stands behind it.
export const DESK_TOP = 0.95

export type Desk = {
  group: THREE.Group
  // Moves what is on the desk for `seconds` spent at it, and returns where the capybara's two
  // paws belong, in the desk's own space. `isActive` is false while it is at the other desk.
  work: (seconds: number, isActive: boolean) => [THREE.Vector3, THREE.Vector3]
}

const box = (size: [number, number, number], material: THREE.Material, at: [number, number, number], radius = 0.04) => {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 4, Math.min(radius, size[0] / 2, size[1] / 2, size[2] / 2)), material)
  mesh.position.set(...at)
  return mesh
}

// A plate with the desk's name, painted on a canvas so it sits flat on the cabinet front.
function labelTexture(text: string, ink: THREE.Color, paper: THREE.Color) {
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 112
  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = paper.getStyle()
    context.beginPath()
    context.roundRect(0, 0, canvas.width, canvas.height, 36)
    context.fill()
    context.fillStyle = ink.getStyle()
    context.font = '600 46px system-ui, sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 2)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// The cabinet and top every desk shares, with its name on the front.
function buildTable(label: string) {
  const foreground = readToken('--foreground')
  const background = readToken('--background')
  const group = new THREE.Group()
  const cabinet = new THREE.MeshStandardMaterial({ color: readToken('--muted'), roughness: 0.8 })
  const top = new THREE.MeshStandardMaterial({ color: background, roughness: 0.6 })
  group.add(box([2.6, DESK_TOP - 0.1, 1.2], cabinet, [0, (DESK_TOP - 0.1) / 2, 1], 0.07))
  group.add(box([2.7, 0.1, 1.3], top, [0, DESK_TOP - 0.05, 1], 0.05))
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.3),
    new THREE.MeshBasicMaterial({ map: labelTexture(label, foreground, background), transparent: true })
  )
  plate.position.set(0, 0.42, 1.605)
  group.add(plate)
  return group
}

const point = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

// Digital marketing: a monitor of climbing bars, a keyboard the paws type on, a megaphone.
function buildMarketingDesk(): Desk {
  const primary = readToken('--primary')
  const foreground = readToken('--foreground')
  const group = buildTable('Digital marketing')
  const plastic = new THREE.MeshStandardMaterial({ color: readToken('--background'), roughness: 0.5 })
  const dark = new THREE.MeshStandardMaterial({ color: foreground, roughness: 0.5 })
  const accent = new THREE.MeshStandardMaterial({ color: primary, roughness: 0.5 })

  const monitor = new THREE.Group()
  monitor.position.set(-0.8, DESK_TOP, 0.8)
  monitor.rotation.y = 0.35
  monitor.add(
    box([0.55, 0.05, 0.38], plastic, [0, 0.025, 0], 0.02),
    box([0.1, 0.36, 0.06], plastic, [0, 0.2, -0.04], 0.02),
    box([1.3, 0.84, 0.08], plastic, [0, 0.82, 0], 0.04)
  )
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 0.68), new THREE.MeshBasicMaterial({ color: foreground }))
  screen.position.set(0, 0.82, 0.045)
  monitor.add(screen)
  const bars = [0, 1, 2, 3].map((index) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1, 0.02), new THREE.MeshBasicMaterial({ color: primary }))
    bar.position.set(-0.4 + index * 0.27, 0.82 - 0.29, 0.06)
    monitor.add(bar)
    return bar
  })
  group.add(monitor)

  group.add(box([0.95, 0.05, 0.34], plastic, [0.1, DESK_TOP + 0.025, 0.85], 0.02))

  const megaphone = new THREE.Group()
  megaphone.position.set(0.95, DESK_TOP + 0.3, 0.75)
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.1, 0.6, 28), accent)
  cone.rotation.z = -1.2
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 14), dark)
  grip.position.set(-0.05, -0.23, 0)
  megaphone.add(cone, grip)
  group.add(megaphone)

  return {
    group,
    work: (seconds, isActive) => {
      bars.forEach((bar, index) => {
        const height = isActive ? 0.12 + 0.3 * (0.5 + 0.5 * Math.sin(seconds * 2.2 + index * 1.4)) : 0.2 + index * 0.06
        bar.scale.y = height
        bar.position.y = 0.82 - 0.34 + height / 2
      })
      megaphone.rotation.y = isActive ? Math.sin(seconds * 3) * 0.12 : 0
      // Paws take turns on the keys, quick enough to read as typing
      const drift = Math.sin(seconds * 2.4) * 0.1
      const left = Math.max(0, Math.sin(seconds * 13))
      const right = Math.max(0, Math.sin(seconds * 13 + Math.PI))
      return [point(-0.18 + drift, DESK_TOP + 0.13 + 0.05 * left, 0.88), point(0.38 + drift, DESK_TOP + 0.13 + 0.05 * right, 0.88)]
    }
  }
}

// Construction: a drafting board with a plan on it, a wall that goes up brick by brick, a hammer.
function buildConstructionDesk(): Desk {
  const group = buildTable('Construction')
  const plastic = new THREE.MeshStandardMaterial({ color: readToken('--background'), roughness: 0.6 })
  const dark = new THREE.MeshStandardMaterial({ color: readToken('--foreground'), roughness: 0.5 })
  const wood = new THREE.MeshStandardMaterial({ color: readToken('--accent-foreground'), roughness: 0.8 })
  const brickMaterial = new THREE.MeshStandardMaterial({
    color: readToken('--match-weak').clone().lerp(readToken('--background'), 0.15),
    roughness: 0.85
  })
  const hammerHead = new THREE.MeshStandardMaterial({ color: readToken('--muted-foreground'), roughness: 0.4 })

  // The board leans toward the viewer; its plan is a grid with a floor plan in the primary colour
  const board = new THREE.Group()
  board.position.set(0, DESK_TOP + 0.3, 0.98)
  board.rotation.x = 0.28
  board.add(box([1.7, 0.07, 1.05], plastic, [0, 0, 0], 0.03))
  const canvas = document.createElement('canvas')
  canvas.width = 340
  canvas.height = 200
  const context = canvas.getContext('2d')
  if (context) {
    const ink = readToken('--primary')
    context.fillStyle = readToken('--muted').getStyle()
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = ink.clone().lerp(readToken('--background'), 0.75).getStyle()
    context.lineWidth = 1
    for (let step = 0; step <= canvas.width; step += 17) {
      context.beginPath()
      context.moveTo(step, 0)
      context.lineTo(step, canvas.height)
      context.stroke()
    }
    for (let step = 0; step <= canvas.height; step += 17) {
      context.beginPath()
      context.moveTo(0, step)
      context.lineTo(canvas.width, step)
      context.stroke()
    }
    context.strokeStyle = ink.getStyle()
    context.lineWidth = 4
    context.strokeRect(34, 30, 150, 140)
    context.strokeRect(184, 62, 120, 108)
    context.beginPath()
    context.moveTo(34, 100)
    context.lineTo(110, 100)
    context.moveTo(184, 120)
    context.lineTo(250, 120)
    context.stroke()
  }
  const plan = new THREE.CanvasTexture(canvas)
  plan.colorSpace = THREE.SRGBColorSpace
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshBasicMaterial({ map: plan }))
  sheet.rotation.x = -Math.PI / 2
  sheet.position.y = 0.037
  board.add(sheet)
  group.add(board, box([1.3, 0.3, 0.5], wood, [0, DESK_TOP + 0.15, 0.62], 0.04))

  // A little wall, three rows high
  const wall = new THREE.Group()
  wall.position.set(0.88, DESK_TOP, 0.8)
  const bricks = [
    [-0.32, 0.1],
    [0, 0.1],
    [0.32, 0.1],
    [-0.16, 0.31],
    [0.16, 0.31],
    [0, 0.52]
  ].map(([x, y]) => {
    const brick = box([0.3, 0.2, 0.24], brickMaterial, [x, y, 0], 0.04)
    wall.add(brick)
    return brick
  })
  group.add(wall)

  const hammer = new THREE.Group()
  hammer.add(
    box([0.07, 0.62, 0.07], dark, [0, 0.2, 0], 0.03),
    box([0.3, 0.17, 0.17], hammerHead, [0, 0.52, 0], 0.04)
  )
  group.add(hammer)

  return {
    group,
    work: (seconds, isActive) => {
      // One brick every half second once the capybara has settled, each popping in
      bricks.forEach((brick, index) => {
        const age = isActive ? (seconds - 0.7 - index * 0.55) / 0.25 : 0
        brick.scale.setScalar(Math.min(1, Math.max(0, age)))
      })
      const swing = isActive ? Math.max(0, Math.sin(seconds * 8)) : 0
      const hit = point(0.42, DESK_TOP + 0.45 + 0.2 * swing, 0.95)
      hammer.visible = isActive
      hammer.position.copy(hit)
      hammer.rotation.z = -0.5 - 0.7 * swing
      const pointing = point(Math.sin(seconds * 1.3) * 0.4, DESK_TOP + 0.46, 0.8)
      return [pointing, hit]
    }
  }
}

export const buildDesks = (): Desk[] => [buildMarketingDesk(), buildConstructionDesk()]
