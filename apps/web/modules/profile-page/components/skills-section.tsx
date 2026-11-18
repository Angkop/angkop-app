import { SKILL_LEVEL_LABELS } from '@angkop/shared'
import { Badge } from '@/components/ui/badge'
import { SectionEmpty } from './section-empty'
import type { MeProfile } from '../types'

export function SkillsSection({ skills }: { skills: MeProfile['skills'] }) {
  if (skills.length === 0) return <SectionEmpty noun="skills" />

  return (
    <ul className="flex flex-wrap gap-2">
      {skills.map((skill) => {
        const detail = [skill.level ? SKILL_LEVEL_LABELS[skill.level] : null, skill.years ? `${skill.years} yrs` : null]
          .filter(Boolean)
          .join(' · ')

        return (
          <li key={skill.name}>
            <Badge className="gap-1.5 py-1 font-medium text-foreground">
              {skill.name}
              {detail ? <span className="font-normal text-muted-foreground">{detail}</span> : null}
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}
