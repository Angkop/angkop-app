import { queryResolvers } from './queries'
import { mutationResolvers } from './mutations'

export type { GraphQLContext } from './types'

export const resolvers = {
  Query: queryResolvers,
  Mutation: mutationResolvers
}
