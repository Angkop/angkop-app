'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { readToken } from './read-token'

// A rounded line between two points on the z = `z` plane, for the cleft above the mouth.
function stroke(from: [number, number], to: [number, number], radius: number, z: number, material: THREE.Material) {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, Math.hypot(dx, dy), 6, 12), material)
  mesh.position.set((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, z)
  mesh.rotation.z = Math.atan2(dy, dx) - Math.PI / 2
  return mesh
}

function flatShape(points: [number, number][], material: THREE.Material) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)))
  return new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false }), material)
}

function buildCapybara() {
  const coat = new THREE.MeshStandardMaterial({ color: readToken('--primary'), roughness: 0.7 })
  const coatDeep = new THREE.MeshStandardMaterial({ color: readToken('--accent-foreground'), roughness: 0.8 })
  const ink = new THREE.MeshStandardMaterial({ color: readToken('--foreground'), roughness: 0.5 })
  const paper = new THREE.MeshStandardMaterial({ color: readToken('--background'), roughness: 0.9 })
  const blush = new THREE.MeshStandardMaterial({
    color: readToken('--match-partial'),
    roughness: 0.9,
    transparent: true,
    opacity: 0.8
  })

  const root = new THREE.Group()

  // Torso, with arms coming forward to two paws resting at the bottom edge, and a shirt
  // collar and tie laid along the slope of the chest.
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), coat)
  body.scale.set(1.85, 1.55, 1.35)
  body.position.set(0, -2.15, -0.1)
  root.add(body)

  for (const side of [-1, 1]) {
    const shoulder = new THREE.Vector3(side * 1.5, -1.55, 0.2)
    const wrist = new THREE.Vector3(side * 0.95, -2.4, 1.3)
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, shoulder.distanceTo(wrist), 8, 20), coat)
    arm.position.copy(shoulder).lerp(wrist, 0.5)
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), wrist.clone().sub(shoulder).normalize())
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.46, 28, 20), coat)
    paw.scale.set(1, 0.75, 1)
    paw.position.copy(wrist).add(new THREE.Vector3(0, -0.05, 0.15))
    root.add(arm, paw)
    for (const toe of [-1, 1]) {
      const crease = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.2, 4, 8), coatDeep)
      crease.position.set(paw.position.x + toe * 0.14, paw.position.y + 0.02, paw.position.z + 0.43)
      root.add(crease)
    }
  }

  const shirt = new THREE.Group()
  shirt.position.set(0, -1.08, 0.97)
  shirt.rotation.x = -0.5
  shirt.add(
    flatShape([[0, 0], [-0.66, 0.2], [-0.3, -0.46]], paper),
    flatShape([[0, 0], [0.3, -0.46], [0.66, 0.2]], paper)
  )
  const blade = flatShape([[-0.1, -0.1], [0.1, -0.1], [0.24, -1.5], [0, -1.74], [-0.24, -1.5]], ink)
  blade.position.z = 0.03
  const knot = flatShape([[-0.15, 0.08], [0.15, 0.08], [0.1, -0.16], [-0.1, -0.16]], ink)
  knot.position.z = 0.07
  shirt.add(blade, knot)
  root.add(shirt)

  // Head: a tall block, flat on top and widest at the jaw, the way a capybara's is.
  const head = new THREE.Group()
  head.position.y = 0.15
  root.add(head)

  const skullGeometry = new RoundedBoxGeometry(2.2, 2.3, 2, 12, 0.75)
  const positions = skullGeometry.getAttribute('position')
  for (let index = 0; index < positions.count; index += 1) {
    const taper = 1.13 - 0.24 * ((positions.getY(index) + 1.15) / 2.3)
    positions.setX(index, positions.getX(index) * taper)
    positions.setZ(index, positions.getZ(index) * taper)
  }
  head.add(new THREE.Mesh(skullGeometry, coat))

  const snout = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), coat)
  snout.scale.set(0.92, 0.56, 0.62)
  snout.position.set(0, -0.6, 0.8)
  head.add(snout)

  const lids: THREE.Mesh[] = []
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.27, 24, 16), coat)
    ear.scale.set(1, 0.85, 0.5)
    ear.position.set(side * 0.88, 0.92, 0.05)
    const innerEar = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 12), coatDeep)
    innerEar.scale.set(1, 0.85, 0.4)
    innerEar.position.set(side * 0.88, 0.92, 0.15)

    // Eyes sit high and wide; a heavy upper lid keeps them half-closed and unbothered.
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), ink)
    eye.position.set(side * 0.62, 0.32, 0.98)
    const lid = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 12, 0, Math.PI * 2, 0, 1.1), coat)
    lid.position.copy(eye.position)
    lid.rotation.z = side * -0.18
    lids.push(lid)

    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 12), blush)
    cheek.scale.set(1, 0.6, 0.25)
    cheek.position.set(side * 0.74, -0.05, 1.0)

    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), ink)
    nostril.scale.set(1, 1.35, 0.5)
    nostril.position.set(side * 0.24, -0.43, 1.37)
    nostril.rotation.z = side * 0.4

    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.028, 10, 20, Math.PI), ink)
    smile.position.set(side * 0.11, -0.76, 1.38)
    smile.rotation.z = Math.PI

    head.add(ear, innerEar, eye, lid, cheek, nostril, smile)
  }
  head.add(stroke([0, -0.6], [0, -0.76], 0.028, 1.4, ink))

  // Everything casts and catches shadows, so the head and arms sit on the body with depth.
  root.traverse((object) => {
    if (object instanceof THREE.Mesh && object.material !== blush) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })

  return { root, body, head, lids }
}

const REST_TURN = -0.32

// The sign-in hero in 3D: the same capybara as CapybaraHero, built from simple solids in the
// palette. It breathes, blinks, and turns its head a little toward the cursor.
// It never mounts for reduced-motion users or without WebGL — the flat CapybaraHero under it
// stays visible until `onReady` fires.
export function Capybara3D({ onReady }: { onReady: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.className = 'size-full'
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
    camera.position.set(0, -0.25, 8.2)
    camera.lookAt(0, -0.45, 0)

    // A soft fill, a key light from the upper left that casts the shadows, and a rim light
    // from behind on the right to lift the silhouette off the white page.
    scene.add(new THREE.HemisphereLight(readToken('--background'), readToken('--primary'), 1.5))
    const key = new THREE.DirectionalLight(readToken('--background'), 2.4)
    key.position.set(-4, 5, 6)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -4
    key.shadow.camera.right = 4
    key.shadow.camera.top = 4
    key.shadow.camera.bottom = -4
    key.shadow.normalBias = 0.04
    const rim = new THREE.DirectionalLight(readToken('--background'), 1.2)
    rim.position.set(5, 2, -4)
    scene.add(key, rim)

    const { root, body, head, lids } = buildCapybara()
    root.rotation.y = REST_TURN
    scene.add(root)

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    resize()

    const pointer = { x: 0, y: 0 }
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointerMove)

    const clock = new THREE.Clock()
    let frame = 0
    let announced = false
    const render = () => {
      const time = clock.getElapsedTime()

      body.scale.y = 1.55 + Math.sin(time * 1.6) * 0.012
      head.position.y = 0.15 + Math.sin(time * 1.6) * 0.015
      head.rotation.y += (pointer.x * 0.2 - head.rotation.y) * 0.06
      head.rotation.x += (pointer.y * 0.06 - head.rotation.x) * 0.06
      // The body rests at a three-quarter turn toward the form and sways slowly, so its depth
      // shows even when the cursor is still.
      const turn = REST_TURN + Math.sin(time * 0.5) * 0.08 + pointer.x * 0.1
      root.rotation.y += (turn - root.rotation.y) * 0.04

      // Lids rest half-closed and shut briefly every 4.5 seconds.
      const blink = Math.max(0, 1 - Math.abs((time % 4.5) - 4.3) / 0.14)
      for (const lid of lids) lid.rotation.x = 0.15 + blink * 0.9

      renderer.render(scene, camera)
      if (!announced) {
        announced = true
        onReady()
      }
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          for (const material of [object.material].flat()) material.dispose()
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [onReady])

  return <div ref={containerRef} aria-hidden="true" className="absolute inset-0" />
}
