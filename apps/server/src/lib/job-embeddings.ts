import { EMBEDDING_DIMENSIONS } from '@angkop/shared'
import { prisma } from './prisma'
import { vectorNorm } from './cosine'
import { createTtlCache } from './ttl-cache'

export type JobEmbedding = {
  vector: Float64Array
  norm: number
}

type EmbeddingRow = { id: string; embedding: number[] }

// Embeddings only change when the nightly ingest re-embeds a listing, so one copy is reused for
// this long. Jobs ingested after the last load are fetched on demand (see below), so a new
// listing never has to wait for a reload to be scored.
const JOB_EMBEDDINGS_TTL_MS = 10 * 60 * 1000

function toJobEmbedding(row: EmbeddingRow): JobEmbedding | null {
  // A job whose embedding has not been filled in yet (events.ts creates one empty and backfills
  // it) has nothing to compare against; it is left out and so is not scored, instead of failing
  // the whole feed on a length mismatch.
  if (row.embedding.length !== EMBEDDING_DIMENSIONS) return null
  const vector = Float64Array.from(row.embedding)
  return { vector, norm: vectorNorm(vector) }
}

// Keeps every live job's embedding in this process's memory, so scoring a cold feed no longer
// reads about 17 MB from Postgres and sends it to the ML service. Doubles, not floats, so the
// scores come out the same as the ones the ML service computes from the same stored numbers.
export function createJobEmbeddingStore({
  loadAll,
  loadSome,
  ttlMs,
  now = Date.now
}: {
  loadAll: () => Promise<EmbeddingRow[]>
  loadSome: (jobIds: string[]) => Promise<EmbeddingRow[]>
  ttlMs: number
  now?: () => number
}) {
  const getAll = createTtlCache(
    async () => {
      const all = new Map<string, JobEmbedding>()
      for (const row of await loadAll()) {
        const embedding = toJobEmbedding(row)
        if (embedding) all.set(row.id, embedding)
      }
      return all
    },
    ttlMs,
    now
  )

  // Ids the database had nothing usable for (deleted, or no embedding yet), so they are not asked
  // for again on every request. Forgotten whenever the full copy reloads.
  let unavailable = new Set<string>()
  let unavailableFor: Map<string, JobEmbedding> | null = null

  return async function getJobEmbeddings(jobIds: string[]): Promise<Map<string, JobEmbedding>> {
    const all = await getAll()
    if (unavailableFor !== all) {
      unavailable = new Set()
      unavailableFor = all
    }

    const found = new Map<string, JobEmbedding>()
    const missing: string[] = []
    for (const jobId of jobIds) {
      const embedding = all.get(jobId)
      if (embedding) {
        found.set(jobId, embedding)
      } else if (!unavailable.has(jobId)) {
        missing.push(jobId)
      }
    }
    if (missing.length === 0) return found

    // Listings ingested since the last full load.
    const loaded = new Set<string>()
    for (const row of await loadSome(missing)) {
      const embedding = toJobEmbedding(row)
      if (!embedding) continue
      found.set(row.id, embedding)
      all.set(row.id, embedding)
      loaded.add(row.id)
    }
    for (const jobId of missing) {
      if (!loaded.has(jobId)) unavailable.add(jobId)
    }
    return found
  }
}

export const getJobEmbeddings = createJobEmbeddingStore({
  loadAll: () =>
    prisma.job.findMany({ where: { deleted: false }, select: { id: true, embedding: true } }),
  loadSome: (jobIds) =>
    prisma.job.findMany({ where: { id: { in: jobIds }, deleted: false }, select: { id: true, embedding: true } }),
  ttlMs: JOB_EMBEDDINGS_TTL_MS
})

// Loads the full copy now, so the first feed after a restart does not pay for it.
export function primeJobEmbeddings(): Promise<unknown> {
  return getJobEmbeddings([])
}
