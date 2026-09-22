import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { signSessionToken } from '../middleware/authenticate'
import { logger } from '../lib/logger'

const DEMO_USER_ID = 'demo-user-1'

export const authRouter = Router()

// SAFE: dev-only stand-in for Google OAuth so the MVP runs without external accounts.
// Real Google OAuth 2.0 via Supabase Auth is the documented plan (see CLAUDE.md) and
// should replace this before anything beyond local demo use.
authRouter.post('/dev-login', async (_req, res) => {
  const user = await prisma.user.findFirst({ where: { id: DEMO_USER_ID, deleted: false } })

  if (!user) {
    res.status(404).json({
      error: 'Demo user not found. Run `pnpm --filter @angkop/server run seed` first.'
    })
    return
  }

  const token = await signSessionToken(user.id)
  logger.info({ userId: user.id }, 'Dev login issued')
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
})
