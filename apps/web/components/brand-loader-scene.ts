import * as THREE from 'three'
import { disposeOf } from '@/components/beaver/dispose-scene'
import { buildFoamyBeaver } from '@/components/beaver/foamy-beaver'
import { readToken } from '@/components/beaver/read-token'

// The 3D behind BrandLoader, kept apart so three.js is only fetched when a loader actually mounts
// rather than landing in every page's bundle (NavLink is used app-wide).

// Outfit indexes on the foamy beaver: the graduate first, then the two jobs from the sign-in page.
const OUTFITS = [2, 0, 1] as const
const OUTFIT_SECONDS = 2.4
// How long the puff of foam around each outfit change lasts, centred on the swap.
const FOAM_SECONDS = 0.7
const STRIDE_RADIANS_PER_SECOND = 14
const HOP_HEIGHT = 0.3
// Where the paws hang while it runs, and how far they swing front to back.
const HANG = [new THREE.Vector3(-1.45, 0.75, 0.55), new THREE.Vector3(1.45, 0.75, 0.55)]
const ARM_SWING = 0.5

// Mounts the running beaver into `host` and returns a cleanup. Throws when WebGL is missing so
// the caller can fall back. `onFirstFrame` fires once something has been drawn.
export function mountBrandLoaderScene(host: HTMLElement, onFirstFrame: () => void): () => void {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.domElement.className = 'size-full'
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60)
  camera.position.set(0, 2.6, 9.6)
  camera.lookAt(0, 1.7, 0)

  const background = readToken('--background')
  scene.add(new THREE.HemisphereLight(background, readToken('--primary').clone().lerp(background, 0.6), 1.4))
  const key = new THREE.DirectionalLight(background, 2.2)
  key.position.set(-3, 10, 6)
  const rim = new THREE.DirectionalLight(background, 1.1)
  rim.position.set(5, 3, -5)
  scene.add(key, rim)

  // A soft blob under the feet instead of a shadow map, which is overkill at loader size.
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: readToken('--foreground'),
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  })
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), shadowMaterial)
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.01
  scene.add(shadow)

  const beaver = buildFoamyBeaver()
  scene.add(beaver.root)

  const resize = () => {
    const { width, height } = host.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  const paws = [HANG[0].clone(), HANG[1].clone()]
  let isAnnounced = false

  // Draws the loader at `time` seconds; a still frame passes isRunning false.
  const draw = (time: number, isRunning: boolean) => {
    const { root, body, head, lids } = beaver
    const stride = isRunning ? Math.sin(time * STRIDE_RADIANS_PER_SECOND) : 0
    const hop = Math.abs(stride) * HOP_HEIGHT

    // Trots in place, turned three-quarters and swaying so it reads as a solid object, not a sprite
    root.position.y = hop
    root.rotation.y = isRunning ? 0.5 + Math.sin(time * 0.9) * 0.3 : 0.5
    root.rotation.z = stride * 0.06
    body.scale.y = 0.95 - stride * 0.02
    head.rotation.x = -stride * 0.05
    const blink = Math.max(0, 1 - Math.abs((time % 3.2) - 3) / 0.14)
    for (const lid of lids) lid.rotation.x = 0.15 + blink * 0.9

    for (const hand of [0, 1]) {
      paws[hand].copy(HANG[hand])
      paws[hand].z += stride * ARM_SWING * (hand === 0 ? 1 : -1)
      beaver.reach(hand, paws[hand])
    }

    // A new outfit every OUTFIT_SECONDS, swapped at the peak of a puff of foam. The clock starts
    // half a cycle in, so the first outfit is already on when the loader appears.
    const cycle = isRunning ? time + OUTFIT_SECONDS / 2 : OUTFIT_SECONDS / 2
    const fromSwap = Math.min(cycle % OUTFIT_SECONDS, OUTFIT_SECONDS - (cycle % OUTFIT_SECONDS))
    const foam = Math.max(0, 1 - fromSwap / (FOAM_SECONDS / 2))
    beaver.wear(OUTFITS[Math.floor(cycle / OUTFIT_SECONDS) % OUTFITS.length])
    beaver.puff(Math.sin((foam * Math.PI) / 2))

    shadow.scale.setScalar(1 - hop * 0.8)
    shadowMaterial.opacity = 0.14 - hop * 0.15

    renderer.render(scene, camera)
    if (!isAnnounced) {
      isAnnounced = true
      onFirstFrame()
    }
  }

  const observer = new ResizeObserver(resize)
  observer.observe(host)
  resize()

  const cleanup = () => {
    observer.disconnect()
    disposeOf(scene)
    renderer.dispose()
    // Loaders mount on every slow navigation; release the GL context now instead of waiting on GC.
    renderer.forceContextLoss()
    renderer.domElement.remove()
  }

  // Reduced motion gets one still frame: the graduation cap, mid-stance.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw(0, false)
    const redraw = new ResizeObserver(() => draw(0, false))
    redraw.observe(host)
    return () => {
      redraw.disconnect()
      cleanup()
    }
  }

  const start = performance.now()
  let frame = requestAnimationFrame(function tick(now) {
    draw((now - start) / 1000, true)
    frame = requestAnimationFrame(tick)
  })
  return () => {
    cancelAnimationFrame(frame)
    cleanup()
  }
}
