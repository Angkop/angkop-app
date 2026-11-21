import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import {
  COLLABORATIVE_WEIGHT_CEILING,
  COLLABORATIVE_WEIGHT_FLOOR,
  COLLABORATIVE_WEIGHT_STEP_PER_INTERACTION,
  blendHybridScore
} from '@angkop/shared'

const ML_CONFIG_PATH = path.resolve(__dirname, '../../../../ml/app/config.py')

function readMlConstant(name: string): number {
  const match = new RegExp(`^${name}\\s*=\\s*([0-9.]+)`, 'm').exec(readFileSync(ML_CONFIG_PATH, 'utf8'))
  assert.ok(match, `${name} not found in ml/app/config.py`)
  return Number(match[1])
}

test('the weight constants match the ML service, which blends the same way', () => {
  assert.equal(COLLABORATIVE_WEIGHT_FLOOR, readMlConstant('COLLABORATIVE_WEIGHT_FLOOR'))
  assert.equal(COLLABORATIVE_WEIGHT_CEILING, readMlConstant('COLLABORATIVE_WEIGHT_CEILING'))
  assert.equal(COLLABORATIVE_WEIGHT_STEP_PER_INTERACTION, readMlConstant('COLLABORATIVE_WEIGHT_STEP_PER_INTERACTION'))
})

test('a new user leans on the semantic score', () => {
  const blended = blendHybridScore(0.8, 0.5, 0)
  assert.equal(blended.collaborativeWeight, 0.1)
  assert.ok(Math.abs(blended.hybridScore - (0.1 * 0.5 + 0.9 * 0.8)) < 1e-12)
})

test('the collaborative weight grows with interactions', () => {
  const few = blendHybridScore(0.8, 0.5, 2)
  const many = blendHybridScore(0.8, 0.5, 8)
  assert.ok(many.collaborativeWeight > few.collaborativeWeight)
})

test('the collaborative weight stops growing at the ceiling', () => {
  const atCeiling = blendHybridScore(0.8, 0.2, 10)
  const wellPast = blendHybridScore(0.8, 0.2, 500)
  assert.equal(atCeiling.collaborativeWeight, COLLABORATIVE_WEIGHT_CEILING)
  assert.equal(wellPast.collaborativeWeight, COLLABORATIVE_WEIGHT_CEILING)
  assert.equal(atCeiling.hybridScore, wellPast.hybridScore)
})

test('the ingredients pass through untouched', () => {
  const blended = blendHybridScore(0.62, 0.41, 3)
  assert.equal(blended.semanticScore, 0.62)
  assert.equal(blended.collaborativeScore, 0.41)
})
