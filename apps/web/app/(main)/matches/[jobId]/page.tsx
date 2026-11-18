import { MatchDetailPage } from '@/modules/match-detail-page/match-detail-page'

export default async function MatchDetail({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params
  return <MatchDetailPage jobId={jobId} />
}
