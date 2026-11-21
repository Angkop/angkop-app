import { JOBS } from '../constants'

// The beaver works two desks in turn. Between them it stops in the middle for a few seconds,
// takes its outfit off and shows its skills against both jobs, then puts the next outfit on and
// walks to the other desk. One loop is both desks and both crossings.
export const STATION_SECONDS = 5
const WALK_SECONDS = 0.7
const PAUSE_SECONDS = 3.4
const CYCLE_SECONDS = STATION_SECONDS + WALK_SECONDS * 2 + PAUSE_SECONDS
export const LOOP_SECONDS = CYCLE_SECONDS * JOBS.length

// The desks stand either side of the middle; the beaver walks between these spots.
export const STATION_X = [-2.1, 2.1] as const
const MIDDLE_X = 0

// What the bubble over its head can be showing.
export type BubbleView = 'thinking' | 'scored' | 'compare'

export type ShiftPose = {
  // the job whose desk the beaver is at, or is walking toward
  job: number
  // where it is along x
  x: number
  // 0 to 1 through a walk, 0 while it stands still
  walk: number
  atDesk: boolean
  // the outfit it wears right now, or -1 for none while it stands in the middle
  outfit: number
  // 0 to 1 and back: the puff of foam that covers each outfit change
  foam: number
  bubble: BubbleView | 'hidden'
  // seconds spent at the current desk, for the work animations
  working: number
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const ease = (value: number) => value * value * (3 - 2 * value)
const pulse = (time: number, from: number, to: number) => Math.sin(Math.PI * clamp((time - from) / (to - from)))

// The shift at `seconds` into the loop. At a desk the bubble thinks for a moment and then shows
// the score; walking it hides; in the middle it shows the skills against both jobs.
export function poseAt(seconds: number): ShiftPose {
  const looped = seconds % LOOP_SECONDS
  const slot = Math.floor(looped / CYCLE_SECONDS)
  const next = (slot + 1) % JOBS.length
  let time = looped - slot * CYCLE_SECONDS

  if (time < STATION_SECONDS) {
    return {
      job: slot,
      x: STATION_X[slot],
      walk: 0,
      atDesk: true,
      outfit: slot,
      foam: 0,
      bubble: time < 0.5 ? 'hidden' : time < 1.7 ? 'thinking' : 'scored',
      working: time
    }
  }
  time -= STATION_SECONDS

  if (time < WALK_SECONDS) {
    const walk = time / WALK_SECONDS
    const x = STATION_X[slot] + (MIDDLE_X - STATION_X[slot]) * ease(walk)
    return { job: next, x, walk, atDesk: false, outfit: slot, foam: 0, bubble: 'hidden', working: 0 }
  }
  time -= WALK_SECONDS

  if (time < PAUSE_SECONDS) {
    return {
      job: next,
      x: MIDDLE_X,
      walk: 0,
      atDesk: false,
      // off in a puff of foam as it stops, on again in another just before it leaves
      outfit: time < 0.25 ? slot : time < 3.15 ? -1 : next,
      foam: pulse(time, 0, 0.5) + pulse(time, 2.9, 3.4),
      bubble: time >= 0.6 && time < 3.0 ? 'compare' : 'hidden',
      working: 0
    }
  }
  time -= PAUSE_SECONDS

  const walk = time / WALK_SECONDS
  const x = MIDDLE_X + (STATION_X[next] - MIDDLE_X) * ease(walk)
  return { job: next, x, walk, atDesk: false, outfit: next, foam: 0, bubble: 'hidden', working: 0 }
}

// What reduced motion sees: the first job, tried on and scored.
export const SETTLED_SECONDS = 3
