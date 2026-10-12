import { Award } from 'lucide-react'
import { formatMonthYear } from '../utils'
import { Timeline, TimelineItem } from './timeline'
import type { MeProfile } from '../types'

export function CertificationsSection({ certifications }: { certifications: MeProfile['certifications'] }) {
  if (certifications.length === 0) {
    return <p className="text-sm text-muted-foreground">No certifications added yet.</p>
  }

  return (
    <Timeline>
      {certifications.map((item, index) => (
        <TimelineItem
          key={index}
          icon={Award}
          title={item.name}
          subtitle={item.issuer}
          period={item.issueDate ? formatMonthYear(item.issueDate) : ''}
          isLast={index === certifications.length - 1}
        />
      ))}
    </Timeline>
  )
}
