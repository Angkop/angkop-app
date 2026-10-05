'use client'

import { useQuery } from '@apollo/client/react'
import { PageHeader } from '@/components/page-header'
import { LoadingSkeleton } from '@/components/loading-skeleton'
import { ErrorMessage } from '@/components/error-message'
import { SkillGapCard } from './components/skill-gap-card'
import { SKILL_GAPS_QUERY } from './queries'
import type { SkillGapsQueryResult } from './types'

export function SkillGapsPage() {
  const { data, loading, error } = useQuery<SkillGapsQueryResult>(SKILL_GAPS_QUERY)

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
            <SkillGapCard key={gap.skill} gap={gap} />
          ))}
        </div>
      )}
    </div>
  )
}
