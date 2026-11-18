export const SCORE_RING = {
  // viewBox units; the ring is drawn in a 120 by 120 box and scaled by its container
  SIZE: 120,
  RADIUS: 52,
  STROKE_WIDTH: 10
} as const

export const SCORE_RING_STROKE = {
  strong: 'stroke-match-strong',
  partial: 'stroke-match-partial',
  weak: 'stroke-match-weak'
} as const
