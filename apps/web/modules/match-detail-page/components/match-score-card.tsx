'use client'

import { useQuery } from '@apollo/client/react'
import { Skeleton } from '@/components/ui/skeleton'
import { JOB_MATCH_INSIGHT_QUERY, type JobMatchInsightQueryResult } from '@/lib/job-match-insight'
import { ScoreRing } from '@/modules/dashboard-page/components/score-ring'

// The score on its own, for the sidebar. It reads the same query as MatchInsightSections, which
// Apollo shares, so the two never disagree and the match is only scored once. Failures are
// reported in the sections beside it, with a retry, so this card just steps aside.
export function MatchScoreCard({ jobId }: { jobId: string }) {
  const { data, loading } = useQuery<JobMatchInsightQueryResult>(JOB_MATCH_INSIGHT_QUERY, {
    variables: { jobId }
  })

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 p-6">
        <Skeleton className="size-32 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
    )
  }
  if (!data) return null

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 p-6">
      <ScoreRing score={data.jobMatchInsight.hybridScore} />
      <p className="text-center text-xs text-muted-foreground">
        Blends how well your skills fit this job with interest from similar seekers.
      </p>
    </div>
  )
}
