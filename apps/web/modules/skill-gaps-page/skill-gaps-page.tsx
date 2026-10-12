'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client/react'
import type { Course } from '@angkop/shared'
import { PageHeader } from '@/components/page-header'
import { ErrorMessage } from '@/components/error-message'
import { PaginationControls } from '@/components/pagination-controls'
import { BrandLoader } from '@/components/brand-loader'
import { StepProgress } from '@/components/step-progress'
import { SkillGapCard } from './components/skill-gap-card'
import { SkillGapsSkeleton } from './components/skill-gaps-skeleton'
import { CourseDetailDialog } from './components/course-detail-dialog'
import { PAGE_SIZE } from './constants'
import { SKILL_GAPS_LOADING_STEPS, SKILL_GAPS_QUERY } from './queries'
import type { SkillGapsQueryResult } from './types'

// How long to wait before swapping the plain skeleton for the "Building your report"
// step-by-step animation. The report is Redis-cached server-side (see getOrSetSkillGaps),
// so a reload with nothing changed resolves almost instantly — showing the multi-step
// "recomputing" story for that case would be misleading. Only once the request runs past
// this threshold do we assume it's a genuine cache miss (a job was saved/unsaved, or skills
// changed) actually re-running the ML call, and switch to the more informative animation.
const RECOMPUTE_REVEAL_DELAY_MS = 400

export function SkillGapsPage() {
  const [selected, setSelected] = useState<{ course: Course; skill: string } | null>(null)
  const [page, setPage] = useState(1)
  const [isRecomputing, setIsRecomputing] = useState(false)

  const { data, loading, error } = useQuery<SkillGapsQueryResult>(SKILL_GAPS_QUERY, {
    variables: { page, pageSize: PAGE_SIZE },
    notifyOnNetworkStatusChange: true
  })

  const isInitialLoad = loading && !data

  useEffect(() => {
    if (!isInitialLoad) {
      setIsRecomputing(false)
      return
    }
    const timer = setTimeout(() => setIsRecomputing(true), RECOMPUTE_REVEAL_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isInitialLoad])

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

      {isInitialLoad ? (
        isRecomputing ? (
          <div className="rounded-lg border border-border p-5">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Building your skill gap report</p>
                <p className="text-xs text-muted-foreground">Based on your saved jobs</p>
              </div>
              <BrandLoader size="sm" />
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <StepProgress steps={SKILL_GAPS_LOADING_STEPS} />
            </div>
          </div>
        ) : (
          <SkillGapsSkeleton />
        )
      ) : error ? (
        <ErrorMessage>Could not load skill gaps: {error.message}</ErrorMessage>
      ) : savedJobCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          No saved jobs yet. Save a job from your matches to get a skill gap report based on what it actually
          requires.
        </p>
      ) : gaps.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No skill gaps found against your saved jobs right now. Your profile already covers what they&apos;re
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
