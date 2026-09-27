import { ApolloClient, HttpLink, InMemoryCache, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { API_URL } from '@/constants/api'
import { getStoredToken } from './auth'

const httpLink = new HttpLink({
  uri: `${API_URL}/graphql`
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
