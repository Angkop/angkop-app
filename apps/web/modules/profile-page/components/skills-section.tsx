import { SKILL_LEVEL_LABELS } from '@angkop/shared'
import { Badge } from '@/components/ui/badge'
import type { MeProfile } from '../types'

export function SkillsSection({ skills }: { skills: MeProfile['skills'] }) {
  return (
    <div className="mt-4 rounded-lg border border-border p-5">
      <h2 className="text-sm font-semibold text-foreground">Skills ({skills.length})</h2>
      {skills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <Badge key={skill.name} variant="secondary">
              {skill.name}
              {skill.level ? ` · ${SKILL_LEVEL_LABELS[skill.level]}` : ''}
              {skill.years ? ` · ${skill.years}y` : ''}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No skills added yet — edit your profile below.</p>
      )}
    </div>
  )
}
