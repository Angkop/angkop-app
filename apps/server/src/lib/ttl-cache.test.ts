import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTtlCache } from './ttl-cache'

test('a value is loaded once and reused until it expires', async () => {
  let clock = 0
  let loads = 0
  const get = createTtlCache(async () => ++loads, 1_000, () => clock)

  assert.equal(await get(), 1)
  clock = 999
  assert.equal(await get(), 1)
  assert.equal(loads, 1)

  clock = 1_000
  assert.equal(await get(), 2)
  assert.equal(loads, 2)
})

test('callers that arrive while it is loading share one load', async () => {
  let loads = 0
  const get = createTtlCache(
    async () => {
      loads++
      await new Promise((resolve) => setTimeout(resolve, 20))
      return 'catalog'
    },
    1_000
  )

  const results = await Promise.all([get(), get(), get()])
  assert.deepEqual(results, ['catalog', 'catalog', 'catalog'])
  assert.equal(loads, 1)
})

test('a failed load is not cached, so the next call tries again', async () => {
  let attempts = 0
  const get = createTtlCache(async () => {
    attempts++
    if (attempts === 1) throw new Error('database unavailable')
    return 'ok'
  }, 1_000)

  await assert.rejects(get(), /database unavailable/)
  assert.equal(await get(), 'ok')
  assert.equal(attempts, 2)
})
