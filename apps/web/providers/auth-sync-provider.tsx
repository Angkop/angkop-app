'use client'

import { useEffect, type ReactNode } from 'react'
import { supabaseClient } from '@/lib/supabase-client'
import { clearStoredToken, storeToken } from '@/lib/auth'

export function AuthSyncProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // One subscription covers three cases: picking up the session right after the Google
    // redirect lands back on the app, Supabase's automatic silent token refresh keeping this
    // in sync before the 1-hour access token expires, and sign-out.
    const {
      data: { subscription }
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (session) {
        storeToken(session.access_token)
      } else {
        clearStoredToken()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <>{children}</>
}
