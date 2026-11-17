import type { ApolloClient } from '@apollo/client'

// Marks root query fields stale so the next read of each goes to the network. Evicts without
// broadcasting: the page that just made the change already updated its own view (hid the row,
// refetched its list), and a broadcast would make every mounted query that reads these fields
// refetch right now - for jobMatches that re-scores the whole feed to reflect one removal.
export function invalidateCachedFields(client: ApolloClient, fieldNames: string[]) {
  for (const fieldName of fieldNames) {
    client.cache.evict({ fieldName, broadcast: false })
  }
  client.cache.gc()
}
