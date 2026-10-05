import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express5'
import { typeDefs } from './graphql/schema'
import { resolvers, type GraphQLContext } from './graphql/resolvers'
import { verifySupabaseToken } from './middleware/authenticate'
import { eventsRouter } from './routes/events'
import { matchScoreRouter } from './routes/match-score'
import { jobsRouter } from './routes/jobs'
import { resumeRouter } from './routes/resume'
import { logger } from './lib/logger'
import { prisma } from './lib/prisma'

const PORT = Number(process.env.PORT ?? 4000)

async function main() {
  const app = express()
  // The extension's content script only runs on Angkop's own listing pages (see
  // CLAUDE.md), so its fetch() calls to /api/events and /api/match-score carry the
  // dashboard's own origin — one allowed origin covers both the dashboard and the extension.
  app.use(cors({ origin: process.env.WEB_URL }))
  app.use(express.json())

  app.get('/health', (_req, res) => res.json({ status: 'ok' }))
  app.use('/api/events', eventsRouter)
  app.use('/api/match-score', matchScoreRouter)
  app.use('/api/jobs', jobsRouter)
  app.use('/api/resume', resumeRouter)

  const apolloServer = new ApolloServer<GraphQLContext>({ typeDefs, resolvers })
  await apolloServer.start()

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const header = req.headers.authorization
        if (!header?.startsWith('Bearer ')) {
          throw new Error('Missing bearer token — sign in with Google first')
        }
        const { userId, email, name } = await verifySupabaseToken(header.slice('Bearer '.length))

        // First request after a real Google sign-in — mirrors the upsert pattern already
        // used in prisma/seed.ts, since User.id has no default and must be supplied.
        await prisma.user.upsert({
          where: { id: userId },
          update: { email, name },
          create: { id: userId, email, name }
        })

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
