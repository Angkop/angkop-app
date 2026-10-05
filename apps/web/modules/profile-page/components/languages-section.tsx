import { Languages as LanguagesIcon } from 'lucide-react'
import { LANGUAGE_PROFICIENCY_LABELS } from '@angkop/shared'
import { Badge } from '@/components/ui/badge'
import type { MeProfile } from '../types'

export function LanguagesSection({ languages }: { languages: MeProfile['languages'] }) {
  return (
    <div className="mt-4 rounded-lg border border-border p-5">
      <h2 className="text-sm font-semibold text-foreground">Languages ({languages.length})</h2>
      {languages.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {languages.map((item, index) => (
            <Badge key={index} variant="secondary" className="gap-1">
              <LanguagesIcon className="size-3" />
              {item.language}
              {item.proficiency ? ` · ${LANGUAGE_PROFICIENCY_LABELS[item.proficiency]}` : ''}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No languages added yet.</p>
      )}
    </div>
  )
}
