import { Languages } from 'lucide-react'

export function LanguageNotice({ detectedLanguage, sourceUrl }: { detectedLanguage: string; sourceUrl: string }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-4 py-2 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Languages className="size-3.5 shrink-0" />
        This posting is in {detectedLanguage}.
      </span>
      <a
        href={`https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(sourceUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 font-medium text-primary hover:underline"
      >
        Translate original
      </a>
    </div>
  )
}
