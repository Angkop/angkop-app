import { Briefcase } from 'lucide-react'
import { EMPLOYMENT_TYPE_LABELS } from '@angkop/shared'
import { formatExperiencePeriod } from '../utils'
import { Timeline, TimelineItem } from './timeline'
import type { MeProfile } from '../types'

export function ExperienceSection({ experience }: { experience: MeProfile['experience'] }) {
  if (experience.length === 0) return <p className="text-sm text-muted-foreground">No experience added yet.</p>

  return (
    <Timeline>
      {experience.map((item, index) => (
        <TimelineItem
          key={index}
          icon={Briefcase}
          title={item.title || 'Untitled role'}
          subtitle={
            [item.company, item.employmentType ? EMPLOYMENT_TYPE_LABELS[item.employmentType] : null]
              .filter(Boolean)
              .join(' · ') || item.company
          }
          period={formatExperiencePeriod(item.startDate, item.endDate, item.current)}
          description={item.description}
          isLast={index === experience.length - 1}
        />
      ))}
    </Timeline>
  )
}
