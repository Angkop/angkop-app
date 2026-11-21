import assert from 'node:assert/strict'
import { test } from 'node:test'
import { EMBEDDING_DIMENSIONS } from '@angkop/shared'
import { createJobEmbeddingStore } from './job-embeddings'

function row(id: string, fill: number, length = EMBEDDING_DIMENSIONS) {
  return { id, embedding: new Array<number>(length).fill(fill) }
}

function makeStore(all: ReturnType<typeof row>[], extra: ReturnType<typeof row>[] = [], now = () => 0) {
  const calls = { all: 0, some: [] as string[][] }
  const get = createJobEmbeddingStore({
    loadAll: async () => {
      calls.all++
      return all
    },
    loadSome: async (jobIds) => {
      calls.some.push(jobIds)
      return [...all, ...extra].filter((entry) => jobIds.includes(entry.id))
    },
    ttlMs: 1_000,
    now
  })
  return { get, calls }
}

test('every job is loaded once and then served from memory', async () => {
  const { get, calls } = makeStore([row('a', 1), row('b', 2)])

  const first = await get(['a', 'b'])
  const second = await get(['a'])

  assert.equal(first.size, 2)
  assert.equal(second.get('a')?.vector[0], 1)
  assert.equal(calls.all, 1)
  assert.deepEqual(calls.some, [])
})

test('the norm is worked out once, when the vector is loaded', async () => {
  const { get } = makeStore([row('a', 2)])
  const embedding = (await get(['a'])).get('a')
  assert.ok(embedding)
  assert.ok(Math.abs(embedding.norm - Math.sqrt(EMBEDDING_DIMENSIONS * 4)) < 1e-9)
})

test('a job ingested after the last load is fetched by itself, then kept', async () => {
  const { get, calls } = makeStore([row('a', 1)], [row('new', 3)])

  assert.equal((await get(['a', 'new'])).get('new')?.vector[0], 3)
  assert.deepEqual(calls.some, [['new']])

  await get(['new'])
  assert.deepEqual(calls.some, [['new']], 'already kept, so no second query')
  assert.equal(calls.all, 1)
})

test('a job with no usable embedding is skipped, and not asked for again', async () => {
  const { get, calls } = makeStore([row('a', 1), row('empty', 1, 0)])

  const result = await get(['a', 'empty'])
  assert.deepEqual([...result.keys()], ['a'])
  assert.deepEqual(calls.some, [['empty']])

  await get(['a', 'empty'])
  assert.deepEqual(calls.some, [['empty']], 'remembered as unavailable until the next full load')
})

test('the full copy reloads after its lifetime', async () => {
  let clock = 0
  const { get, calls } = makeStore([row('a', 1)], [], () => clock)

  await get(['a'])
  clock = 1_000
  await get(['a'])

  assert.equal(calls.all, 2)
})
