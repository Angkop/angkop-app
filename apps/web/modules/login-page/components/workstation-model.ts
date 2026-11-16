import { MATCH_EXAMPLES } from '../constants'

// The desk runs on a 12s loop, one example per slot: the capybara types the profile, hits enter,
// and the screen shows the job it matches and how strongly.
export const LOOP_SECONDS = 12
const SLOT_SECONDS = LOOP_SECONDS / MATCH_EXAMPLES.length

export const KEY_ROWS = 3
export const KEY_COLUMNS = 9

const TYPING = { from: 0.25, to: 1.75 }
const ENTER = { at: 1.85, seconds: 0.15 }

export type Hand = 'left' | 'right'
export type Press = { row: number; column: number; hand: Hand; depth: number }

export type DeskPose = {
  example: (typeof MATCH_EXAMPLES)[number]
  // the profile as typed so far, with a cursor while the capybara is still at the keys
  typed: string
  // the key held down (depth 0 to 1), if any
  press: Press | null
  // 0 to 1: how far the job and the keyword line have appeared
  result: number
  // 0 to 1 of the full bar: the match score as the bar fills
  reading: number
  // 0 to 1: the whole result fades out before the next example
  fade: number
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const ease = (value: number) => value * value * (3 - 2 * value)
const between = (time: number, from: number, to: number) => ease(clamp((time - from) / (to - from)))

// Each character is struck on its own key, alternating hands: the left hand takes the left five
// columns, the right hand the right five. The pattern repeats every loop.
function keyFor(index: number): Pick<Press, 'row' | 'column' | 'hand'> {
  const spread = (index * 7 + 3) % (KEY_ROWS * 5)
  const hand: Hand = index % 2 === 0 ? 'left' : 'right'
  return { row: spread % KEY_ROWS, column: (hand === 'left' ? 0 : 4) + (spread % 5), hand }
}

export function poseAt(seconds: number): DeskPose {
  const looped = seconds % LOOP_SECONDS
  const example = MATCH_EXAMPLES[Math.min(MATCH_EXAMPLES.length - 1, Math.floor(looped / SLOT_SECONDS))]
  const time = looped % SLOT_SECONDS

  const length = example.profile.length
  const interval = (TYPING.to - TYPING.from) / length
  const progress = (time - TYPING.from) / interval
  const isTyping = progress >= 0 && progress < length
  const struck = progress < 0 ? 0 : Math.min(length, Math.floor(progress) + 1)
  const isEntering = time >= ENTER.at && time < ENTER.at + ENTER.seconds

  let press: Press | null = null
  if (isTyping) {
    press = { ...keyFor(Math.floor(progress)), depth: Math.sin(Math.PI * (progress % 1)) }
  } else if (isEntering) {
    press = { row: 1, column: KEY_COLUMNS - 1, hand: 'right', depth: Math.sin((Math.PI * (time - ENTER.at)) / ENTER.seconds) }
  }

  const isAtKeys = time < ENTER.at + ENTER.seconds
  const cursor = isAtKeys && Math.floor(time * 3) % 2 === 0 ? '|' : ''
  return {
    example,
    typed: example.profile.slice(0, struck) + cursor,
    press,
    result: between(time, 2.0, 2.4),
    reading: example.score * between(time, 2.1, 2.9),
    fade: 1 - between(time, 3.5, 3.95)
  }
}

// What reduced motion sees: the first example, typed and answered.
export const SETTLED_POSE = poseAt(3.0)
