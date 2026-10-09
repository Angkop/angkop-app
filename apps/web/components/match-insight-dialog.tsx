'use client'

import { useQuery } from '@apollo/client/react'
import { AlertTriangle, BarChart3, CheckCircle2, GraduationCap, Sparkles, Target, Users } from 'lucide-react'
import type { MatchInsight } from '@angkop/shared'
import { getMatchLabel } from '@angkop/shared'
import {
  JOB_MATCH_INSIGHT_QUERY,
  MATCH_INSIGHT_LOADING_STEPS,
  type JobMatchInsightQueryResult
} from '@/lib/job-match-insight'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ErrorMessage } from '@/components/error-message'
import { BrandLoader } from '@/components/brand-loader'
import { StepProgress } from '@/components/step-progress'
import { variantForScore } from '@/components/match-score-badge'

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2">
      <p className="text-base font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function ReasonAccordionItem({
  value,
  icon: Icon,
  label,
  reason,
  score,
  metrics
}: {
  value: string
  icon: typeof Target
  label: string
  reason: string
  score: number
  metrics: { label: string; value: string }[]
}) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>
        <span className="flex items-center gap-2.5 text-foreground">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
            <Icon className="size-3.5" />
          </span>
          {label}
        </span>
        <Badge variant={variantForScore(score)}>{Math.round(score * 100)}%</Badge>
      </AccordionTrigger>
      <AccordionContent>
        <p className="text-xs leading-relaxed text-muted-foreground">{reason}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {metrics.map((metric) => (
            <Metric key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
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

function InsightBody({ insight }: { insight: MatchInsight }) {
  return (
    <div className="space-y-5">
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

      <div>
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">Why this percentage</p>
        <Accordion type="multiple" className="rounded-2xl border border-border px-4">
          <ReasonAccordionItem
            value="skills"
            icon={BarChart3}
            label="Skills & experience fit"
            reason={insight.skillsReason}
            score={insight.semanticScore}
            metrics={[
              { label: 'Required skills', value: String(insight.requiredSkillsCount) },
              { label: 'You matched', value: String(insight.matchingSkills.length) },
              { label: 'Worth growing', value: String(insight.missingSkills.length) }
            ]}
          />
          <ReasonAccordionItem
            value="activity"
            icon={Users}
            label="Interest from similar seekers"
            reason={insight.activityReason}
            score={insight.collaborativeScore}
            metrics={[
              { label: 'Your activity logged', value: `${insight.interactionCount} action${insight.interactionCount === 1 ? '' : 's'}` },
              { label: 'Weight in overall score', value: `${Math.round(insight.collaborativeWeight * 100)}%` }
            ]}
          />
        </Accordion>
      </div>

      <div>
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <Sparkles className="size-3.5" />
          AI insight
        </p>
        <p className="rounded-2xl border border-border p-4 text-sm leading-relaxed text-foreground">
          {insight.explanation}
        </p>
      </div>

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
  )
}

export function MatchInsightDialog({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  jobCompany
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  jobTitle: string
  jobCompany: string
}) {
  const { data, loading, error } = useQuery<JobMatchInsightQueryResult>(JOB_MATCH_INSIGHT_QUERY, {
    variables: { jobId },
    skip: !open
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <DialogTitle>Why this is a match</DialogTitle>
          </div>
          <DialogDescription>
            {jobTitle} · {jobCompany}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{jobTitle}</p>
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

        {!loading && !error && data ? <InsightBody insight={data.jobMatchInsight} /> : null}
      </DialogContent>
    </Dialog>
  )
}
