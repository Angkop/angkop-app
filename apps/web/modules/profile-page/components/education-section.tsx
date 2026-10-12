import { GraduationCap } from 'lucide-react'
import { formatEducationPeriod } from '../utils'
import { Timeline, TimelineItem } from './timeline'
import type { MeProfile } from '../types'

export function EducationSection({ education }: { education: MeProfile['education'] }) {
  if (education.length === 0) return <p className="text-sm text-muted-foreground">No education added yet.</p>

  return (
    <Timeline>
      {education.map((item, index) => (
        <TimelineItem
          key={index}
          icon={GraduationCap}
          title={item.school || 'Untitled school'}
          subtitle={[item.degree, item.fieldOfStudy].filter(Boolean).join(', ')}
          period={formatEducationPeriod(item.startYear, item.endYear)}
          description={item.description}
          isLast={index === education.length - 1}
        />
      ))}
    </Timeline>
  )
}
