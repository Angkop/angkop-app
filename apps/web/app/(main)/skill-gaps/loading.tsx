import { PageHeader } from '@/components/page-header'
import { SkillGapsSkeleton } from '@/modules/skill-gaps-page/components/skill-gaps-skeleton'

export default function Loading() {
  return (
    <div>
      <PageHeader
        title="Skill Gap Report"
        description="See what's missing for your saved jobs, and the courses that can close the gap."
      />
      <SkillGapsSkeleton />
    </div>
  )
}
