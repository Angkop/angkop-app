import { ListingDetailPage } from '@/modules/listing-detail-page/listing-detail-page'

export default async function ListingDetail({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  return <ListingDetailPage jobId={jobId} />
}
