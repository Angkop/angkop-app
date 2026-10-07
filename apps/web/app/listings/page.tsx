import { ListingsPage } from '@/modules/listings-page/listings-page'

type ListingsSearchParams = Promise<{ page?: string; q?: string; source?: string; skill?: string }>

export default async function Listings({ searchParams }: { searchParams: ListingsSearchParams }) {
  const params = await searchParams
  return <ListingsPage searchParams={params} />
}
