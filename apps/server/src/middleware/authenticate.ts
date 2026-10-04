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
