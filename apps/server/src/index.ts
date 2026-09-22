import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { typeDefs } from './graphql/schema'
import { resolvers, type GraphQLContext } from './graphql/resolvers'
import { verifySessionToken } from './middleware/authenticate'
import { authRouter } from './routes/auth'
import { eventsRouter } from './routes/events'
import { matchScoreRouter } from './routes/match-score'
import { logger } from './lib/logger'

const PORT = Number(process.env.PORT ?? 4000)

async function main() {
  const app = express()
  // Permissive CORS: local-only MVP, and /api/events needs to accept requests from the
  // browser extension's content-script origin (varies by target job platform, plus the
  // extension's own chrome-extension:// origin), not just the dashboard. Would need to
  // be locked down to specific origins before any real deployment.
  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => res.json({ status: 'ok' }))
  app.use('/auth', authRouter)
  app.use('/api/events', eventsRouter)
  app.use('/api/match-score', matchScoreRouter)

  const apolloServer = new ApolloServer<GraphQLContext>({ typeDefs, resolvers })
  await apolloServer.start()

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const header = req.headers.authorization
        if (!header?.startsWith('Bearer ')) {
          throw new Error('Missing bearer token — call POST /auth/dev-login first')
        }
        const userId = await verifySessionToken(header.slice('Bearer '.length))
        return { userId }
      }
    })
  )

  app.listen(PORT, () => {
    logger.info(`Express API listening on http://localhost:${PORT}`)
    logger.info(`GraphQL endpoint at http://localhost:${PORT}/graphql`)
  })
}

main().catch((error) => {
  logger.error({ error }, 'Failed to start server')
  process.exit(1)
})
