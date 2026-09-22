import { ApolloClient, HttpLink, InMemoryCache, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getStoredToken } from './auth'

const httpLink = new HttpLink({
  uri: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/graphql`
})

const authLink = setContext((_, { headers }) => {
  const token = getStoredToken()
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {})
    }
  }
})

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache()
})
