import type { NextFunction, Request, Response } from 'express'
import { jwtVerify, SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret')

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifySessionToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  if (typeof payload.userId !== 'string') {
    throw new Error('Session token is missing userId')
  }
  return payload.userId
}

export type AuthenticatedRequest = Request & { userId?: string }

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing bearer token' })
    return
  }

  try {
    req.userId = await verifySessionToken(header.slice('Bearer '.length))
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired session token' })
  }
}
