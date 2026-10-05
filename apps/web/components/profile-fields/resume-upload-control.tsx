import { FileText, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ResumeUploadControl({
  resumeFileName,
  onResumeFileNameChange
}: {
  resumeFileName: string
  onResumeFileNameChange: (value: string) => void
}) {
  return resumeFileName ? (
    <div className="flex items-center gap-2 rounded-lg border border-border p-3">
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{resumeFileName}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Remove resume"
        onClick={() => onResumeFileNameChange('')}
      >
        <X className="size-4" />
      </Button>
    </div>
  ) : (
    <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border p-8 text-center hover:border-foreground/30 hover:bg-muted/40">
      <Upload className="size-5 text-muted-foreground" />
      <span className="text-sm font-medium text-foreground">Click to upload, or drag and drop</span>
      <span className="text-xs text-muted-foreground">PDF, up to 10MB</span>
      <input
        type="file"
        accept=".pdf"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onResumeFileNameChange(file.name)
        }}
      />
    </label>
  )
}
