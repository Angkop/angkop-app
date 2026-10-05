import { Award } from 'lucide-react'
import { formatMonthYear } from '../utils'
import { Timeline, TimelineItem } from './timeline'
import type { MeProfile } from '../types'

export function CertificationsSection({ certifications }: { certifications: MeProfile['certifications'] }) {
  return (
    <div className="mt-4 rounded-lg border border-border p-5">
      <h2 className="text-sm font-semibold text-foreground">Certifications ({certifications.length})</h2>
      {certifications.length > 0 ? (
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
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No certifications added yet.</p>
      )}
    </div>
  )
}
