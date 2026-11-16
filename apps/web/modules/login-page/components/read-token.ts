import * as THREE from 'three'

// three.js can't parse oklch(), so each palette token is painted onto a 1px canvas and read
// back as sRGB — the scene stays on the globals.css tokens without hardcoding any hex.
export function readToken(token: string): THREE.Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!context) return new THREE.Color()
  context.fillStyle = value
  context.fillRect(0, 0, 1, 1)
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace)
}
