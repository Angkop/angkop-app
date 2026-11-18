'use client'

import { PageHeader } from '@/components/page-header'
import { GapPath } from './components/gap-path'
import { MatchesRegion } from './components/matches-region'
import { PipelineStrip } from './components/pipeline-strip'

// Each region fetches and renders on its own, so the matches show up as soon as they are
// ready instead of waiting on the slowest query (skill gaps can call the ML service).
export function DashboardPage() {
  return (
    <div className="space-y-12">
      <PageHeader title="Your matches" />
      <MatchesRegion />
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
        <PipelineStrip />
        <GapPath />
      </div>
    </div>
  )
}
