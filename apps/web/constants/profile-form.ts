import {
  CAREER_LEVEL_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  LANGUAGE_PROFICIENCY_LABELS,
  SKILL_LEVEL_LABELS,
  WORK_SETUP_LABELS
} from '@angkop/shared'
import type { FieldOption } from '@/components/common/form/types'

// The shared label maps as the option lists Form.Field's select takes.
function toOptions(labels: Record<string, string>): FieldOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}

export const CAREER_LEVEL_OPTIONS = toOptions(CAREER_LEVEL_LABELS)
export const WORK_SETUP_OPTIONS = toOptions(WORK_SETUP_LABELS)
export const EMPLOYMENT_TYPE_OPTIONS = toOptions(EMPLOYMENT_TYPE_LABELS)
export const SKILL_LEVEL_OPTIONS = toOptions(SKILL_LEVEL_LABELS)
export const LANGUAGE_PROFICIENCY_OPTIONS = toOptions(LANGUAGE_PROFICIENCY_LABELS)
