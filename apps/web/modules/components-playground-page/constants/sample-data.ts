import { MATCH_SCORE_THRESHOLDS, type ApplicationStatus } from '@angkop/shared'
import type { FieldOption } from '@/components/common/form/types'
import type { JobMatchSummary } from '@/lib/job-matches'

export const SAMPLE_ROLE_OPTIONS: FieldOption[] = [
  { value: 'frontend', label: 'Frontend Developer' },
  { value: 'backend', label: 'Backend Developer' },
  { value: 'data', label: 'Data Analyst' },
  { value: 'legacy', label: 'Archived Role', disabled: true }
]

export const SAMPLE_SKILL_NAMES = [
  'React',
  'TypeScript',
  'Node.js',
  'Python',
  'SQL',
  'GraphQL',
  'Docker',
  'AWS',
  'Figma',
  'Tailwind CSS',
  'Next.js',
  'PostgreSQL',
  'Redis',
  'Git',
  'Jest',
  'Prisma',
  'FastAPI',
  'Machine Learning',
  'Data Visualization',
  'Technical Writing'
]

export const SAMPLE_SKILL_OPTIONS: FieldOption[] = SAMPLE_SKILL_NAMES.map((name) => ({ value: name, label: name }))

export const SAMPLE_JOB: JobMatchSummary['job'] = {
  id: 'playground-job',
  title: 'Junior Frontend Engineer',
  company: 'Sample Company',
  description:
    'Build and ship customer-facing dashboards with a small product team. You will own features from first sketch to release, and pair with designers and backend engineers along the way.',
  requiredSkills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
  sourceName: 'Arbeitnow'
}

// One score per band, plus the two edges where the label flips.
export const MATCH_SCORE_SAMPLES = [
  { score: 0.92, note: 'Strong, well above the cutoff' },
  { score: MATCH_SCORE_THRESHOLDS.STRONG, note: 'Strong, exactly at the cutoff' },
  { score: 0.55, note: 'Partial, mid band' },
  { score: MATCH_SCORE_THRESHOLDS.PARTIAL, note: 'Partial, exactly at the cutoff' },
  { score: 0.18, note: 'Weak, below the cutoff' }
] as const

export const SAMPLE_APPLICATION_ROWS: { id: string; title: string; company: string; status: ApplicationStatus }[] = [
  { id: 'row-1', title: 'Junior Frontend Engineer', company: 'Sample Company', status: 'APPLIED' },
  { id: 'row-2', title: 'Data Analyst', company: 'Example Corp', status: 'AWAITING_INTERVIEW' },
  { id: 'row-3', title: 'QA Engineer', company: 'Demo Labs', status: 'UNSUCCESSFUL' }
]

export const SAMPLE_DESCRIBED_OPTIONS: FieldOption[] = [
  { value: 'full-time', label: 'Full-time', description: 'A regular schedule with benefits' },
  { value: 'part-time', label: 'Part-time', description: 'Fewer hours, often flexible' },
  { value: 'contract', label: 'Contract', description: 'A fixed term for a specific project' }
]
