import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cosineSimilarity, semanticScore, vectorNorm } from './cosine'

// Deterministic vectors built from integers and one exact division, so Python and JavaScript get
// bit-identical inputs. The expected values are what cosine_similarity in
// ml/app/services/embedder.py (numpy) returned for the same pairs.
function vector(seed: number): Float64Array {
  return Float64Array.from({ length: 384 }, (_, index) => (((index * 7919 + seed * 104729) % 2001) - 1000) / 1000)
}

function similarity(a: Float64Array, b: Float64Array): number {
  return cosineSimilarity(a, vectorNorm(a), b, vectorNorm(b))
}

const FROM_PYTHON: [number, number, number][] = [
  [1, 2, -0.3375437145769755],
  [3, 17, -0.15511490021591648],
  [5, 5, 1.0],
  [11, 40, 0.08171981844293466]
]

test('matches the ML service to within floating point rounding', () => {
  for (const [seedA, seedB, expected] of FROM_PYTHON) {
    const actual = similarity(vector(seedA), vector(seedB))
    assert.ok(Math.abs(actual - expected) < 1e-12, `seeds ${seedA}/${seedB}: ${actual} vs ${expected}`)
  }
})

test('an all-zero vector (a user with no profile yet) scores 0', () => {
  const zero = new Float64Array(384)
  assert.equal(similarity(vector(1), zero), 0)
  assert.equal(similarity(zero, zero), 0)
})

test('the semantic score is clamped at 0 instead of going negative', () => {
  const a = vector(1)
  const opposite = a.map((value) => -value)
  assert.ok(Math.abs(similarity(a, opposite) - -1) < 1e-12)
  assert.equal(semanticScore(a, vectorNorm(a), opposite, vectorNorm(opposite)), 0)
})

test('vectors of different lengths are an error, not a silent wrong score', () => {
  assert.throws(() => similarity(vector(1), new Float64Array(10).fill(1)), /different lengths/)
})
