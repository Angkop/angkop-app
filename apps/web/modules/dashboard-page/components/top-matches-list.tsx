'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowRight } from 'lucide-react'
import type { JobMatchSummary } from '@/lib/job-matches'
import { TopMatchCard } from './top-match-card'

// Only needed once the user opens a match's explanation, not on every dashboard load.
const MatchInsightDialog = dynamic(
  () => import('@/components/match-insight-dialog').then((mod) => mod.MatchInsightDialog),
  { ssr: false }
)

export function TopMatchesList({ matches, totalCount }: { matches: JobMatchSummary[]; totalCount: number }) {
  const [insightTarget, setInsightTarget] = useState<JobMatchSummary['job'] | null>(null)

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Top Matches</h2>
        {totalCount > matches.length ? (
          <Link
            href="/matches"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View all {totalCount} matches
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No job matches yet.{' '}
          <Link href="/listings" className="font-medium text-primary hover:underline">
            Browse listings
          </Link>{' '}
          to see what&apos;s available now. New postings are added regularly, so check back soon.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {matches.map((match, index) => (
            <TopMatchCard key={match.job.id} match={match} rank={index + 1} onViewInsight={setInsightTarget} />
          ))}
        </div>
      )}

      {insightTarget ? (
        <MatchInsightDialog
          open
          onOpenChange={(open) => {
            if (!open) setInsightTarget(null)
          }}
          jobId={insightTarget.id}
          jobTitle={insightTarget.title}
          jobCompany={insightTarget.company}
        />
      ) : null}
    </section>
  )
}
