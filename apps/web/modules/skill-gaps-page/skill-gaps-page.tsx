'use client'

import { gql, useQuery } from '@apollo/client'
import type { SkillGap } from '@angkop/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    return (
      <div className="flex flex-col gap-4">
        {[1, 2].map((key) => (
          <div key={key} className="h-24 animate-pulse rounded-lg border border-border bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-destructive">Could not load skill gaps: {error.message}</p>
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
