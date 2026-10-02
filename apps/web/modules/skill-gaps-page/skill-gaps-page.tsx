'use client'

import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import type { SkillGap } from '@angkop/shared'
import { PageHeader } from '@/components/page-header'
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

  return (
    <div>
      <PageHeader
        title="Skill Gap Report"
        description="See what's missing for your top matches, and the courses that can close the gap."
      />

      {gaps.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No skill gaps found against your top matches right now — your profile already covers what those roles are
          looking for.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {gaps.map((gap) => (
            <div key={gap.skill} className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-foreground">Add {gap.skill}</p>
              {gap.courses.length > 0 ? (
                <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
                  {gap.courses.map((course) => (
                    <a
                      key={course.url}
                      href={course.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-foreground hover:text-primary"
                    >
                      {course.title} — {course.provider}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
