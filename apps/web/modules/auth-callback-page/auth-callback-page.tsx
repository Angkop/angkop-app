'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { gql } from '@apollo/client'
import { PageLoader } from '@/components/page-loader'
import { apolloClient } from '@/lib/apollo-client'
import { supabaseClient } from '@/lib/supabase-client'

const HAS_PROFILE_QUERY = gql`
  query HasProfile {
    me {
      profile {
        id
      }
    }
  }
`

type HasProfileResult = {
  me: { profile: { id: string } | null }
}

export function AuthCallbackPage() {
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

  return <PageLoader label="Signing you in…" />
}
