import { Languages } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function MentionedLanguagesList({ languages }: { languages: string[] }) {
  return (
    <div className="mt-4 border-t border-border pt-4">
      <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Languages className="size-3.5" />
        Languages Mentioned
      </h2>
      {languages.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {languages.map((language) => (
            <Badge key={language} variant="outline">
              {language}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No languages mentioned in this posting.</p>
      )}
    </div>
  )
}
