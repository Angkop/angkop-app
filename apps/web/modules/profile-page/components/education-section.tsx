import { GraduationCap } from 'lucide-react'
import { formatEducationPeriod } from '../utils'
import { Timeline, TimelineItem } from './timeline'
import type { MeProfile } from '../types'

export function EducationSection({ education }: { education: MeProfile['education'] }) {
  return (
    <div className="mt-4 rounded-lg border border-border p-5">
      <h2 className="text-sm font-semibold text-foreground">Education</h2>
      {education.length > 0 ? (
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
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No education added yet.</p>
      )}
    </div>
  )
}
