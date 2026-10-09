'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@apollo/client/react'
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Maximize2,
  Minimize2,
  Sparkles,
  Target,
  Users
} from 'lucide-react'
import { APPLICATION_STATUS_LABELS, getMatchLabel, type SavedJob } from '@angkop/shared'
import {
  JOB_MATCH_INSIGHT_QUERY,
  MATCH_INSIGHT_LOADING_STEPS,
  type JobMatchInsightQueryResult
} from '@/lib/job-match-insight'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ErrorMessage } from '@/components/error-message'
import { BrandLoader } from '@/components/brand-loader'
import { StepProgress } from '@/components/step-progress'
import { cn } from '@/lib/utils'
import { variantForScore } from '@/components/match-score-badge'

function ScoreMeter({ label, score }: { label: string; score: number }) {
  const percent = Math.round(score * 100)
  const variant = variantForScore(score)
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn(
            'h-full rounded-full',
            variant === 'strong' ? 'bg-match-strong' : variant === 'partial' ? 'bg-match-partial' : 'bg-match-weak'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <p className="text-base font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function SkillChips({ skills, tone }: { skills: string[]; tone: 'match' | 'growth' }) {
  if (skills.length === 0) return <p className="text-xs text-muted-foreground">None found.</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <Badge key={skill} variant={tone === 'match' ? 'strong' : 'outline'}>
          {skill}
        </Badge>
      ))}
    </div>
  )
}

export function ApplicationInsightDialog({
  open,
  onOpenChange,
  savedJob
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  savedJob: SavedJob
}) {
  const [expanded, setExpanded] = useState(true)
  const { data, loading, error } = useQuery<JobMatchInsightQueryResult>(JOB_MATCH_INSIGHT_QUERY, {
    variables: { jobId: savedJob.job.id },
    skip: !open
  })

  const insight = data?.jobMatchInsight

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(expanded ? 'max-w-5xl max-h-[90vh]' : 'max-w-2xl')}>
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div>
                <DialogTitle>How this job matches you</DialogTitle>
                <DialogDescription>
                  {savedJob.job.title} · {savedJob.job.company}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={expanded ? 'Shrink dialog' : 'Enlarge dialog'}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{savedJob.job.title}</p>
                <p className="text-xs text-muted-foreground">Analyzing this match</p>
              </div>
              <BrandLoader size="sm" />
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <StepProgress steps={MATCH_INSIGHT_LOADING_STEPS} />
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border p-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </span>
            <ErrorMessage>Could not load this match&apos;s insight: {error.message}</ErrorMessage>
          </div>
        ) : null}

        {!loading && !error && insight ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Job snapshot</p>
                <div className="rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                    {savedJob.job.company}
                  </div>
                  <p className="mt-1 text-sm text-foreground">{savedJob.job.title}</p>
                  {savedJob.job.sourceName ? (
                    <Badge variant="outline" className="mt-2">
                      {savedJob.job.sourceName}
                    </Badge>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {savedJob.job.requiredSkills.map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {APPLICATION_STATUS_LABELS[savedJob.status]}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Saved</dt>
                      <dd className="mt-0.5 font-medium text-foreground">
                        {new Date(savedJob.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                    {savedJob.interviewDate ? (
                      <div>
                        <dt className="text-muted-foreground">Interview date</dt>
                        <dd className="mt-0.5 font-medium text-foreground">
                          {new Date(savedJob.interviewDate).toLocaleDateString()}
                        </dd>
                      </div>
                    ) : null}
                    {savedJob.tags.length > 0 ? (
                      <div className="col-span-2">
                        <dt className="text-muted-foreground">Tags</dt>
                        <dd className="mt-1 flex flex-wrap gap-1.5">
                          {savedJob.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  <Link
                    href={`/listings/${savedJob.job.id}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    View full listing
                    <ExternalLink className="size-3.5" />
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Match breakdown</p>

                <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary">
                    <Target className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">Overall match</p>
                    <p className="text-xs text-muted-foreground">{getMatchLabel(insight.hybridScore)}</p>
                  </div>
                  <Badge variant={variantForScore(insight.hybridScore)} className="text-sm">
                    {Math.round(insight.hybridScore * 100)}%
                  </Badge>
                </div>

                <Accordion type="multiple" className="rounded-2xl border border-border px-4">
                  <AccordionItem value="skills">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2.5 text-foreground">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                          <BarChart3 className="size-3.5" />
                        </span>
                        Skills & experience fit
                      </span>
                      <Badge variant={variantForScore(insight.semanticScore)}>
                        {Math.round(insight.semanticScore * 100)}%
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <ScoreMeter label="Skills & experience fit" score={insight.semanticScore} />
                      <p className="text-xs leading-relaxed text-muted-foreground">{insight.skillsReason}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <Metric label="Required skills" value={String(insight.requiredSkillsCount)} />
                        <Metric label="You matched" value={String(insight.matchingSkills.length)} />
                        <Metric label="Worth growing" value={String(insight.missingSkills.length)} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="activity">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2.5 text-foreground">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                          <Users className="size-3.5" />
                        </span>
                        Interest from similar seekers
                      </span>
                      <Badge variant={variantForScore(insight.collaborativeScore)}>
                        {Math.round(insight.collaborativeScore * 100)}%
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <ScoreMeter label="Interest from similar seekers" score={insight.collaborativeScore} />
                      <p className="text-xs leading-relaxed text-muted-foreground">{insight.activityReason}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <Metric
                          label="Your activity logged"
                          value={`${insight.interactionCount} action${insight.interactionCount === 1 ? '' : 's'}`}
                        />
                        <Metric
                          label="Weight in overall score"
                          value={`${Math.round(insight.collaborativeWeight * 100)}%`}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <CheckCircle2 className="size-3.5" />
                      Matching skills
                    </p>
                    <SkillChips skills={insight.matchingSkills} tone="match" />
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <GraduationCap className="size-3.5" />
                      Skills to grow
                    </p>
                    <SkillChips skills={insight.missingSkills} tone="growth" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                <Sparkles className="size-3.5" />
                AI insight
              </p>
              <p className="rounded-2xl border border-border p-4 text-sm leading-relaxed text-foreground">
                {insight.explanation}
              </p>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
