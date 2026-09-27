'use client'

import type { ReactNode } from 'react'
import { ApolloProvider } from '@apollo/client/react'
import { apolloClient } from '@/lib/apollo-client'

export function AppApolloProvider({ children }: { children: ReactNode }) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>
}
