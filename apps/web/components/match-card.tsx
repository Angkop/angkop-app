'use client'

import { useState } from 'react'
import { Archive, Bookmark, Loader2 } from 'lucide-react'
import type { JobMatchSummary } from '@/lib/job-matches'
import { DismissConfirm } from '@/components/dismiss-confirm'
import { MatchScoreBadge } from '@/components/match-score-badge'
import { NavLink } from '@/components/nav-link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MATCH_CARD_MAX_SKILLS, MATCH_CARD_SUMMARY_LENGTH } from '@/constants/match-card'
import { summarizeDescription } from '@/lib/job-summary'

type MatchCardProps = {
  job: JobMatchSummary['job']
  score: number
  onSave?: (jobId: string) => void
  onDismiss?: (jobId: string) => Promise<boolean>
  isSaving?: boolean
  isDismissing?: boolean
}

// One cell of the matches grid (see MatchGrid, which draws the lines between cells), laid out
// like a post on the Magic UI blog index: title, a short summary, then a footer. The score sits
// in the footer as a small badge. The whole card is the link to the match's own page, through a
// stretched link on the title; the footer actions sit above it so they stay clickable.
export function MatchCard({ job, score, onSave, onDismiss, isSaving = false, isDismissing = false }: MatchCardProps) {
  const [isConfirmingDismiss, setIsConfirmingDismiss] = useState(false)
  const summary = summarizeDescription(job.description, MATCH_CARD_SUMMARY_LENGTH)
  const visibleSkills = job.requiredSkills.slice(0, MATCH_CARD_MAX_SKILLS)
  const hiddenSkillCount = job.requiredSkills.length - visibleSkills.length

  return (
    <article className="group relative flex flex-col border-r border-b border-border bg-background transition-colors hover:bg-muted/30 has-[h3_a:focus-visible]:outline-2 has-[h3_a:focus-visible]:-outline-offset-2 has-[h3_a:focus-visible]:outline-primary">
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="space-y-1">
          <h3 className="text-xl leading-snug font-semibold text-balance text-card-foreground">
            <NavLink
              href={`/matches/${job.id}`}
              pendingLabel="Opening match…"
              className="underline-offset-4 outline-none group-hover:underline after:absolute after:inset-0"
            >
              {job.title}
            </NavLink>
          </h3>
          <p className="text-sm text-muted-foreground">
            {job.company}
            {job.sourceName ? ` · ${job.sourceName}` : ''}
          </p>
        </div>

        {summary ? <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{summary}</p> : null}

        {job.requiredSkills.length > 0 ? (
          <ul aria-label="Required skills" className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {visibleSkills.map((skill) => (
              <li key={skill}>
                <Badge>{skill}</Badge>
              </li>
            ))}
            {hiddenSkillCount > 0 ? (
              <li>
                <Badge variant="outline">+{hiddenSkillCount}</Badge>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      <div className="relative z-10 border-t border-border px-6 py-3">
        {isConfirmingDismiss && onDismiss ? (
          <DismissConfirm
            title={job.title}
            company={job.company}
            isDismissing={isDismissing}
            onConfirm={async () => {
              await onDismiss(job.id)
              setIsConfirmingDismiss(false)
            }}
            onCancel={() => setIsConfirmingDismiss(false)}
          />
        ) : (
          <div className="flex items-center justify-between gap-2">
            <MatchScoreBadge score={score} />
            <div className="-mr-2 flex shrink-0 items-center gap-1">
              {onSave ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={isSaving ? 'Saving job' : 'Save job'}
                      disabled={isSaving}
                      onClick={() => onSave(job.id)}
                    >
                      {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Bookmark className="size-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isSaving ? 'Saving…' : 'Save job'}</TooltipContent>
                </Tooltip>
              ) : null}
              {onDismiss ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Dismiss job"
                      onClick={() => setIsConfirmingDismiss(true)}
                    >
                      <Archive className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Dismiss job</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
