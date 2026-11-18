import { Languages as LanguagesIcon } from 'lucide-react'
import { LANGUAGE_PROFICIENCY_LABELS } from '@angkop/shared'
import { Badge } from '@/components/ui/badge'
import { SectionEmpty } from './section-empty'
import type { MeProfile } from '../types'

export function LanguagesSection({ languages }: { languages: MeProfile['languages'] }) {
  if (languages.length === 0) return <SectionEmpty noun="languages" />

  return (
    <div className="flex flex-wrap gap-1.5">
      {languages.map((item, index) => (
        <Badge key={index} className="gap-1">
          <LanguagesIcon className="size-3" />
          {item.language}
          {item.proficiency ? ` · ${LANGUAGE_PROFICIENCY_LABELS[item.proficiency]}` : ''}
        </Badge>
      ))}
    </div>
  )
}
