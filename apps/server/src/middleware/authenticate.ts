import type { NextFunction, Request, Response } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''

// Lazy singleton: createRemoteJWKSet caches Supabase's public keys internally and only
// refetches on a kid it hasn't seen, so one instance should live for the process lifetime.
const jwks = createRemoteJWKSet(new URL('/auth/v1/.well-known/jwks.json', SUPABASE_URL))

export type VerifiedSupabaseUser = {
  userId: string
  email: string
  name: string | null
}

export async function verifySupabaseToken(token: string): Promise<VerifiedSupabaseUser> {
  const { payload } = await jwtVerify(token, jwks)
  if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
    throw new Error('Session token is missing sub or email')
  }

  const metadata = payload.user_metadata as Record<string, unknown> | undefined
  const name = (metadata?.full_name ?? metadata?.name ?? null) as string | null

  return { userId: payload.sub, email: payload.email, name }
}

// For REST routes (the GraphQL endpoint verifies the token inline in its own context
// function instead). Dashboard-only endpoints — unlike the extension-facing routers in
// routes/, which trust a client-supplied userId — so this is the only place in routes/
// that needs a real session.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token — sign in with Google first' })
    return
  }

  try {
    const { userId } = await verifySupabaseToken(header.slice('Bearer '.length))
    res.locals.userId = userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' })
  }
}
