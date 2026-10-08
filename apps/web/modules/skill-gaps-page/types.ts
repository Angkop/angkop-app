import type { SkillGap } from '@angkop/shared'

export type SkillGapsPage = {
  items: SkillGap[]
  total: number
}

export type SkillGapsQueryResult = {
  skillGaps: SkillGapsPage
  savedJobCount: number
}
