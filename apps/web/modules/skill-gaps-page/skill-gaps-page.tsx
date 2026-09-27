'use client'

import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import type { SkillGap } from '@angkop/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'

const SKILL_GAPS_QUERY = gql`
  query SkillGaps {
    skillGaps {
      skill
      confidence
      courses {
        title
        provider
        url
      }
    }
  }
`

export function SkillGapsPage() {
  const { data, loading, error } = useQuery<{ skillGaps: SkillGap[] }>(SKILL_GAPS_QUERY)

  if (loading) {
    return <LoadingSkeleton rows={2} heightClassName="h-24" />
  }

  if (error) {
    return <ErrorMessage>Could not load skill gaps: {error.message}</ErrorMessage>
  }

  const gaps = data?.skillGaps ?? []

  if (gaps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No skill gaps found against your top matches right now — your profile already covers what
        those roles are looking for.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {gaps.map((gap) => (
        <Card key={gap.skill}>
          <CardHeader>
            <CardTitle>Add {gap.skill}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Recommended courses</p>
            <ul className="flex flex-col gap-1">
              {gap.courses.map((course) => (
                <li key={course.url}>
                  <a
                    href={course.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline underline-offset-2"
                  >
                    {course.title} — {course.provider}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
