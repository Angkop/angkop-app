'use client'

import { useQuery } from '@apollo/client/react'
import { AlertTriangle, BarChart3, Target, Users } from 'lucide-react'
import type { MatchInsight } from '@angkop/shared'
import { getMatchLabel } from '@angkop/shared'
import {
  JOB_MATCH_INSIGHT_QUERY,
  MATCH_INSIGHT_LOADING_STEPS,
  type JobMatchInsightQueryResult
} from '@/lib/job-match-insight'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader
} from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ErrorMessage } from '@/components/error-message'
import { BrandLoader } from '@/components/brand-loader'
import { StepProgress } from '@/components/step-progress'
import { variantForScore } from '@/components/match-score-badge'
import { SkillsComparison } from '@/components/skills-comparison'

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-base font-medium tabular-nums text-foreground">{value}</p>
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
        <span className="flex items-center gap-2 text-foreground">
          <Icon className="size-4 shrink-0 text-primary" />
          {label}
        </span>
        <Badge variant={variantForScore(score)} className="font-display tabular-nums">
          {Math.round(score * 100)}%
        </Badge>
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

function InsightBody({ insight }: { insight: MatchInsight }) {
  return (
    // mb-6: this dialog has no footer, which is what normally gives the body room at the bottom
    <div className="mb-6 space-y-5">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Target className="size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Overall match</p>
          <p className="text-xs text-muted-foreground">{getMatchLabel(insight.hybridScore)}</p>
        </div>
        <Badge variant={variantForScore(insight.hybridScore)} className="font-display text-sm tabular-nums">
          {Math.round(insight.hybridScore * 100)}%
        </Badge>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">Why this percentage</p>
        <Accordion type="multiple" className="rounded-lg border border-border px-4">
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
        <p className="mb-3 text-sm font-medium text-muted-foreground">AI insight</p>
        <p className="rounded-lg border border-border p-4 text-sm leading-relaxed text-foreground">
          {insight.explanation}
        </p>
      </div>

      <SkillsComparison matching={insight.matchingSkills} growing={insight.missingSkills} />
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
  const { data, loading, error, refetch } = useQuery<JobMatchInsightQueryResult>(JOB_MATCH_INSIGHT_QUERY, {
    variables: { jobId },
    skip: !open
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title="Why this is a match" description={<>{jobTitle} · {jobCompany}</>} />

        {loading ? (
          <div className="mb-6 rounded-lg border border-border p-5">
            <div className="flex items-center gap-3">
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
          <div className="mb-6 flex flex-col items-center gap-3 rounded-lg border border-border p-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </span>
            <ErrorMessage onRetry={refetch} retryLabel="Reload Insight">
              Could not load this match&apos;s insight: {error.message}
            </ErrorMessage>
          </div>
        ) : null}

        {!loading && !error && data ? <InsightBody insight={data.jobMatchInsight} /> : null}
      </DialogContent>
    </Dialog>
  )
}
