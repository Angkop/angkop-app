'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client/react'
import type { Course } from '@angkop/shared'
import { PageHeader } from '@/components/page-header'
import { ErrorMessage } from '@/components/error-message'
import { PaginationControls } from '@/components/pagination-controls'
import { SkillGapCard } from './components/skill-gap-card'
import { SkillGapsSkeleton } from './components/skill-gaps-skeleton'
import { CourseDetailDialog } from './components/course-detail-dialog'
import { PAGE_SIZE } from './constants'
import { SKILL_GAPS_QUERY } from './queries'
import type { SkillGapsQueryResult } from './types'

export function SkillGapsPage() {
  const [selected, setSelected] = useState<{ course: Course; skill: string } | null>(null)
  const [page, setPage] = useState(1)

  const { data, loading, error } = useQuery<SkillGapsQueryResult>(SKILL_GAPS_QUERY, {
    variables: { page, pageSize: PAGE_SIZE },
    notifyOnNetworkStatusChange: true
  })

  const gaps = data?.skillGaps.items ?? []
  const total = data?.skillGaps.total ?? 0
  const savedJobCount = data?.savedJobCount ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <PageHeader
        title="Skill Gap Report"
        description="See what's missing for your saved jobs, and the courses that can close the gap."
      />

      {loading && !data ? (
        <SkillGapsSkeleton />
      ) : error ? (
        <ErrorMessage>Could not load skill gaps: {error.message}</ErrorMessage>
      ) : savedJobCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          No saved jobs yet. Save a job from your matches to get a skill gap report based on what it actually
          requires.
        </p>
      ) : gaps.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No skill gaps found against your saved jobs right now — your profile already covers what they&apos;re
          looking for.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {gaps.map((gap) => (
            <SkillGapCard
              key={gap.skill}
              gap={gap}
              onSelectCourse={(course, skill) => setSelected({ course, skill })}
            />
          ))}

          <PaginationControls page={page} pageCount={pageCount} onChange={setPage} />
        </div>
      )}

      <CourseDetailDialog
        course={selected?.course ?? null}
        skill={selected?.skill ?? null}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </div>
  )
}
