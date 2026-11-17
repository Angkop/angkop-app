'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { cn } from '@/lib/utils'
import { CapybaraHero } from './capybara-hero'
import { buildDesks } from './desks'
import { disposeOf } from './dispose-scene'
import { buildFoamyCapybara } from './foamy-capybara'
import { JobBubble } from './job-bubble'
import { readToken } from './read-token'
import { SETTLED_SECONDS, STATION_X, poseAt, type BubbleView } from './shift-model'

// Where the capybara stands behind a desk, and how its arms hang while it walks between them.
const STAND_Z = -0.6
const HANG = [new THREE.Vector3(-1.4, 0.7, 0.55), new THREE.Vector3(1.4, 0.7, 0.55)]
const HEAD_TOP = 3.35

// The sign-in hero: one soft capybara and two desks, digital marketing and construction. It works
// one desk, tries that job on (the bubble over its head asks how well it fits and answers in
// a percentage and the skill it lacks), then walks to the middle, takes its outfit off and shows
// its skills against both jobs, then puts the next outfit on and goes to the other desk. The
// same person scores very differently for each job, which is what Angkop measures.
// It never mounts for reduced-motion users beyond one still frame. The stage stays empty until the
// first frame is drawn, then fades in; without WebGL the flat CapybaraHero takes its place.
export function CapybaraShift({ className }: { className?: string }) {
  const container = useRef<HTMLDivElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const [shown, setShown] = useState<{ job: number; view: BubbleView; isVisible: boolean }>({
    job: 0,
    view: 'thinking',
    isVisible: false
  })

  useEffect(() => {
    const host = container.current
    if (!host) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setHasFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.domElement.className = 'size-full'
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1.5, 0.1, 60)
    camera.position.set(0, 3.5, 11.8)
    camera.lookAt(0, 1.4, 0.2)

    // A soft fill, a key light from the upper left that casts the shadows, a rim from behind
    scene.add(new THREE.HemisphereLight(readToken('--background'), readToken('--primary').clone().lerp(readToken('--background'), 0.6), 1.4))
    const key = new THREE.DirectionalLight(readToken('--background'), 2.2)
    key.position.set(-3, 10, 6)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -7
    key.shadow.camera.right = 7
    key.shadow.camera.top = 6
    key.shadow.camera.bottom = -3
    key.shadow.normalBias = 0.04
    const rim = new THREE.DirectionalLight(readToken('--background'), 1.1)
    rim.position.set(5, 3, -5)
    scene.add(key, rim)

    const stage = new THREE.Mesh(
      new RoundedBoxGeometry(7.8, 0.2, 3.8, 4, 0.08),
      new THREE.MeshStandardMaterial({ color: readToken('--border'), roughness: 0.9 })
    )
    stage.position.set(0, -0.1, 0.5)
    stage.receiveShadow = true
    scene.add(stage)

    const desks = buildDesks()
    desks.forEach((desk, index) => {
      desk.group.position.x = STATION_X[index]
      desk.group.traverse((object) => {
        object.castShadow = true
        object.receiveShadow = true
      })
      scene.add(desk.group)
    })

    const capybara = buildFoamyCapybara()
    capybara.root.position.z = STAND_Z
    scene.add(capybara.root)

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const pointer = { x: 0, y: 0 }
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointerMove)

    const paws = [HANG[0].clone(), HANG[1].clone()]
    const world = new THREE.Vector3()
    const local = new THREE.Vector3()
    let shownKey = ''
    // What the bubble last showed, which it keeps while it fades out
    let content: { job: number; view: BubbleView } = { job: 0, view: 'thinking' }
    let announced = false

    // Draws the shift at `time` seconds; `dt` is the seconds since the last frame (Infinity snaps).
    const draw = (time: number, dt: number) => {
      const pose = poseAt(time)
      const follow = 1 - Math.exp(-dt * 14)
      const isWalking = pose.walk > 0
      const stride = Math.sin(pose.walk * Math.PI * 4)

      // Body: breathes while it stands, hops and rolls a little while it walks
      const { root, body, head, lids } = capybara
      root.position.x = pose.x
      root.position.y = isWalking ? Math.abs(stride) * 0.16 : 0
      root.rotation.z = isWalking ? stride * 0.06 : 0
      body.scale.y = 0.95 + Math.sin(time * 1.6) * 0.012 + (isWalking ? stride * 0.02 : 0)
      capybara.wear(pose.outfit)
      capybara.puff(pose.foam)

      head.rotation.y += (pointer.x * 0.35 - head.rotation.y) * 0.06
      head.rotation.x += (pointer.y * 0.12 - head.rotation.x) * 0.06
      const blink = Math.max(0, 1 - Math.abs((time % 4.5) - 4.3) / 0.14)
      for (const lid of lids) lid.rotation.x = 0.15 + blink * 0.9

      // Desks run their own props; the one the capybara is at also says where its paws go
      desks.forEach((desk, index) => {
        const isAt = pose.atDesk && pose.job === index
        const targets = desk.work(isAt ? pose.working : 0, isAt)
        for (const hand of [0, 1]) {
          if (isAt) {
            world.copy(targets[hand]).add(desk.group.position)
            local.copy(world).sub(root.position)
          } else {
            local.copy(HANG[hand])
            if (isWalking) local.z += stride * 0.3 * (hand === 0 ? 1 : -1)
          }
          if (isAt || index === pose.job) paws[hand].lerp(local, follow)
        }
      })
      capybara.reach(0, paws[0])
      capybara.reach(1, paws[1])

      renderer.render(scene, camera)

      // The bubble follows the head; its words change only when the state does
      const isVisible = pose.bubble !== 'hidden'
      if (pose.bubble !== 'hidden') content = { job: pose.job, view: pose.bubble }
      const next = `${content.job}:${content.view}:${isVisible}`
      if (next !== shownKey) {
        shownKey = next
        setShown({ ...content, isVisible })
      }
      const element = bubble.current
      if (element) {
        const { width, height } = host.getBoundingClientRect()
        world.set(root.position.x, HEAD_TOP + root.position.y, root.position.z + 0.05).project(camera)
        const half = element.offsetWidth / 2
        const x = Math.min(width - half - 8, Math.max(half + 8, (world.x * 0.5 + 0.5) * width))
        element.style.transform = `translate(${x}px, ${(-world.y * 0.5 + 0.5) * height}px) translate(-50%, -100%)`
      }
      if (!announced) {
        announced = true
        setIsReady(true)
      }
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    const cleanup = () => {
      observer.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      disposeOf(scene)
      renderer.dispose()
      renderer.domElement.remove()
    }

    // Reduced motion gets one settled frame: the first job tried on and scored.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw(SETTLED_SECONDS, Infinity)
      const redraw = new ResizeObserver(() => draw(SETTLED_SECONDS, Infinity))
      redraw.observe(host)
      return () => {
        redraw.disconnect()
        cleanup()
      }
    }

    const start = performance.now()
    let last = start
    let frame = 0
    const tick = (now: number) => {
      draw((now - start) / 1000, Math.min(0.1, (now - last) / 1000))
      last = now
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      cleanup()
    }
  }, [])

  return (
    <div className={cn('relative aspect-[3/2] w-full', className)}>
      {hasFailed && <CapybaraHero className="mx-auto h-full w-auto" />}
      <div
        ref={container}
        aria-hidden="true"
        className={cn(
          'absolute inset-0 opacity-0 transition-opacity duration-500 motion-reduce:transition-none',
          isReady && 'opacity-100'
        )}
      />
      <JobBubble ref={bubble} job={shown.job} view={shown.view} isVisible={shown.isVisible} />
    </div>
  )
}
