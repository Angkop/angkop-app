import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, before, test } from 'node:test'

let server: Server
let mlClient: typeof import('./ml-client')

// A stand-in ML service: /ok answers at once, /hang never answers.
before(async () => {
  server = createServer((request, response) => {
    if (request.url === '/ok') {
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ embedding: [0.5] }))
    }
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  // ml-client reads ML_SERVICE_URL when it loads, so it is imported only after the port is known.
  process.env.ML_SERVICE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  mlClient = await import('./ml-client.js')
})

after(() => {
  server.closeAllConnections()
  server.close()
})

test('a request that gets an answer is returned as before', async () => {
  const result = await mlClient.postJson<{ embedding: number[] }>('/ok', {}, 2_000)
  assert.deepEqual(result.embedding, [0.5])
})

test('a hung ML service fails at the deadline as a 504 instead of waiting forever', async () => {
  const start = Date.now()
  await assert.rejects(mlClient.postJson('/hang', {}, 300), (error: unknown) => {
    assert.ok(error instanceof mlClient.MlServiceError)
    assert.equal(error.status, 504)
    return true
  })
  assert.ok(Date.now() - start < 2_000, 'should give up shortly after the 300 ms deadline')
})
