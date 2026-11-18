'use client'

import { useQuery } from '@apollo/client/react'
import { AlertTriangle, BarChart3, Users } from 'lucide-react'
import type { MatchInsight } from '@angkop/shared'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { BrandLoader } from '@/components/brand-loader'
import { ErrorMessage } from '@/components/error-message'
import { variantForScore } from '@/components/match-score-badge'
import { SkillsComparison } from '@/components/skills-comparison'
import { StepProgress } from '@/components/step-progress'
import {
  JOB_MATCH_INSIGHT_QUERY,
  MATCH_INSIGHT_LOADING_STEPS,
  type JobMatchInsightQueryResult
} from '@/lib/job-match-insight'

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
  icon: typeof BarChart3
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
    <div className="space-y-8">
      <p className="rounded-lg border border-border p-4 text-sm leading-relaxed text-foreground">
        {insight.explanation}
      </p>

      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Why this percentage</h3>
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
              {
                label: 'Your activity logged',
                value: `${insight.interactionCount} action${insight.interactionCount === 1 ? '' : 's'}`
              },
              { label: 'Weight in overall score', value: `${Math.round(insight.collaborativeWeight * 100)}%` }
            ]}
          />
        </Accordion>
      </div>

      <SkillsComparison matching={insight.matchingSkills} growing={insight.missingSkills} />
    </div>
  )
}

export function MatchInsightSections({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const { data, loading, error, refetch } = useQuery<JobMatchInsightQueryResult>(JOB_MATCH_INSIGHT_QUERY, {
    variables: { jobId }
  })

  return (
    <section aria-labelledby="match-insight-heading">
      <h2 id="match-insight-heading" className="mb-4 font-display text-xl font-semibold text-foreground">
        Why this is a match
      </h2>

      {loading && !data ? (
        <div className="rounded-lg border border-border p-5">
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

      {error && !data ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border p-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </span>
          <ErrorMessage onRetry={refetch} retryLabel="Reload Insight">
            Could not load this match&apos;s insight: {error.message}
          </ErrorMessage>
        </div>
      ) : null}

      {data ? <InsightBody insight={data.jobMatchInsight} /> : null}
    </section>
  )
}
