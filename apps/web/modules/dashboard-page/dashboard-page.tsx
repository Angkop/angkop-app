'use client'

import { gql } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import { Sparkles, Target } from 'lucide-react'
import { MATCH_SCORE_THRESHOLDS, type JobMatch } from '@angkop/shared'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { JobRow } from '@/components/job-row'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'

const JOB_MATCHES_QUERY = gql`
  query JobMatches {
    jobMatches {
      hybridScore
      semanticScore
      collaborativeScore
      job {
        id
        title
        company
        description
        platform
        requiredSkills
        url
      }
    }
  }
`

const LOG_INTERACTION_MUTATION = gql`
  mutation LogInteraction($jobId: ID!, $eventType: String!) {
    logInteraction(jobId: $jobId, eventType: $eventType)
  }
`

export function DashboardPage() {
  const { data, loading, error, refetch } = useQuery<{ jobMatches: JobMatch[] }>(JOB_MATCHES_QUERY)
  const [logInteraction] = useMutation(LOG_INTERACTION_MUTATION)

  async function handleInteraction(jobId: string, eventType: 'save' | 'dismiss') {
    await logInteraction({ variables: { jobId, eventType } })
    await refetch()
  }

  if (loading) {
    return <LoadingSkeleton rows={3} heightClassName="h-16" />
  }

  if (error) {
    return <ErrorMessage>Could not load job matches: {error.message}</ErrorMessage>
  }

  const matches = data?.jobMatches ?? []
  const strongMatches = matches.filter((match) => match.hybridScore >= MATCH_SCORE_THRESHOLDS.STRONG)

  return (
    <div>
      <PageHeader title="Your matches" description="Jobs ranked by how well they fit your profile." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New Matches" value={matches.length} caption="From ingested listings" icon={Sparkles} />
        <StatCard
          label="Strong Matches"
          value={strongMatches.length}
          caption="70% hybrid score or higher"
          icon={Target}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Top Matches</h2>
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No job matches yet. Run the seed script to load sample postings, then refresh.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {matches.map((match) => (
              <JobRow
                key={match.job.id}
                job={match.job}
                score={match.hybridScore}
                onSave={(jobId) => handleInteraction(jobId, 'save')}
                onDismiss={(jobId) => handleInteraction(jobId, 'dismiss')}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
