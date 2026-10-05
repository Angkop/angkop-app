'use client'

import { PageLoader } from '@/components/page-loader'
import { useRouteAfterSignIn } from './hooks/use-route-after-sign-in'

export function AuthCallbackPage() {
  useRouteAfterSignIn()

  return <PageLoader label="Signing you in…" />
}
