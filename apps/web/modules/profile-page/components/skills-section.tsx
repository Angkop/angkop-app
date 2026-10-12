import { SKILL_LEVEL_LABELS } from '@angkop/shared'
import { Badge } from '@/components/ui/badge'
import type { MeProfile } from '../types'

export function SkillsSection({ skills }: { skills: MeProfile['skills'] }) {
  if (skills.length === 0) {
    return <p className="text-sm text-muted-foreground">No skills added yet — edit your profile below.</p>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <Badge key={skill.name} variant="secondary">
          {skill.name}
          {skill.level ? ` · ${SKILL_LEVEL_LABELS[skill.level]}` : ''}
          {skill.years ? ` · ${skill.years}y` : ''}
        </Badge>
      ))}
    </div>
  )
}
