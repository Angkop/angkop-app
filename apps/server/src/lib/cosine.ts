// Same arithmetic, in the same order, as cosine_similarity in ml/app/services/embedder.py:
// dot(a, b) / (|a| * |b|), and 0 when either vector is all zeros (a user with no profile yet).
// The norms are passed in so a vector compared against thousands of others is measured once.
export function vectorNorm(vector: ArrayLike<number>): number {
  let sumOfSquares = 0
  for (let index = 0; index < vector.length; index++) {
    sumOfSquares += vector[index] * vector[index]
  }
  return Math.sqrt(sumOfSquares)
}

export function cosineSimilarity(
  a: ArrayLike<number>,
  aNorm: number,
  b: ArrayLike<number>,
  bNorm: number
): number {
  if (a.length !== b.length) {
    throw new Error(`Cannot compare embeddings of different lengths (${a.length} and ${b.length})`)
  }
  const denominator = aNorm * bNorm
  if (denominator === 0) return 0

  let dot = 0
  for (let index = 0; index < a.length; index++) {
    dot += a[index] * b[index]
  }
  return dot / denominator
}

// The semantic half of the match score. Sentence-BERT cosine similarity is typically in [0, 1]
// for related text but can dip slightly negative for unrelated text, so it is clamped to keep
// the score a clean percentage - the same clamp as _hybrid in ml/app/routers/recommendations.py.
export function semanticScore(
  userVector: ArrayLike<number>,
  userNorm: number,
  jobVector: ArrayLike<number>,
  jobNorm: number
): number {
  return Math.max(0, cosineSimilarity(userVector, userNorm, jobVector, jobNorm))
}
