'use client'

import Link from 'next/link'
import { ArrowRight, ClipboardList } from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorMessage } from '@/components/error-message'
import { buttonVariants } from '@/components/ui/button'
import { DASHBOARD_PIPELINE_QUERY } from '../queries'
import type { DashboardPipelineQueryResult } from '../types'
import { PipelineSkeleton } from './dashboard-skeleton'
import { PipelineFlow } from './pipeline-flow'

// Fetches the per-status counts (the server returns them in pipeline order) and hands them to
// PipelineFlow to draw.
export function PipelineStrip() {
  // Cached numbers show immediately and are refreshed in the background, since a status
  // changed on the Applications page should be reflected when the seeker comes back here.
  const { data, error, refetch } = useQuery<DashboardPipelineQueryResult>(DASHBOARD_PIPELINE_QUERY, {
    fetchPolicy: 'cache-and-network'
  })

  if (!data && !error) return <PipelineSkeleton />
  if (!data) {
    return (
      <ErrorMessage onRetry={refetch} retryLabel="Reload Pipeline">
        Could not load your applications: {error?.message}
      </ErrorMessage>
    )
  }

  const { total, statusCounts } = data.savedJobStats

  return (
    <section aria-labelledby="pipeline-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="pipeline-heading" className="text-sm font-semibold text-foreground">
          Application Pipeline
        </h2>
        {total > 0 ? (
          <Link href="/applications" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            View Applications
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>

      {total === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No applications tracked yet"
          description="Save a job from your matches and it will appear here, ready to move through each stage."
          action={
            <Link href="/matches" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              View Matches
            </Link>
          }
        />
      ) : (
        <PipelineFlow statusCounts={statusCounts} />
      )}
    </section>
  )
}
