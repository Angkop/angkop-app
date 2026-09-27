'use client'

import { gql } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'
import type { JobMatch } from '@angkop/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchScoreBadge } from '@/components/match-score-badge'

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
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((key) => (
          <div key={key} className="h-32 animate-pulse rounded-lg border border-border bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive">Could not load job matches: {error.message}</p>
  }

  const matches = data?.jobMatches ?? []

  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No job matches yet. Run the seed script to load sample postings, then refresh.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {matches.map((match) => (
        <Card key={match.job.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{match.job.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {match.job.company} · {match.job.platform}
              </p>
            </div>
            <MatchScoreBadge score={match.hybridScore} />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{match.job.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {match.job.requiredSkills.map((skill) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button size="sm" onClick={() => handleInteraction(match.job.id, 'save')}>
              Save Job
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleInteraction(match.job.id, 'dismiss')}>
              Dismiss Job
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
