import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apolloClient } from '@/lib/apollo-client'
import { supabaseClient } from '@/lib/supabase-client'
import { HAS_PROFILE_QUERY } from '../queries'
import type { HasProfileResult } from '../types'

export function useRouteAfterSignIn() {
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    async function routeAfterSignIn() {
      // Right after the Google redirect lands here, Supabase is still parsing the auth
      // tokens out of the URL — getSession() awaits that before resolving.
      const {
        data: { session }
      } = await supabaseClient.auth.getSession()
      if (!isMounted) return
      if (!session) {
        router.replace('/')
        return
      }

      // A profile only exists once completeOnboarding has run at least once — that's
      // the signal for "already set up" vs. "needs the wizard."
      const { data } = await apolloClient.query<HasProfileResult>({
        query: HAS_PROFILE_QUERY,
        fetchPolicy: 'network-only'
      })
      if (!isMounted) return

      router.replace(data?.me.profile ? '/dashboard' : '/onboarding')
    }

    routeAfterSignIn().catch(() => {
      if (isMounted) router.replace('/')
    })

    return () => {
      isMounted = false
    }
  }, [router])
}
