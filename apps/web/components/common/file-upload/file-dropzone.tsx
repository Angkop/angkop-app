'use client'

import { useState } from 'react'
import { CloudUpload } from 'lucide-react'
import { cn } from '@/lib/utils'

// A dashed drop zone that is also a button: click it or drop files on it. It only hands back what
// was chosen. Checking type and size is the caller's job, since each upload has its own rules.
export function FileDropzone({
  onFilesSelected,
  accept,
  multiple = false,
  disabled = false,
  invalid = false,
  title = 'Click to upload, or drag and drop',
  hint,
  className
}: {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  disabled?: boolean
  invalid?: boolean
  title?: string
  hint?: string
  className?: string
}) {
  const [isDragging, setIsDragging] = useState(false)

  function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])
    if (files.length === 0) return
    onFilesSelected(multiple ? files : files.slice(0, 1))
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        setIsDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setIsDragging(false)
        if (!disabled) handleFiles(event.dataTransfer.files)
      }}
      className={cn(
        'flex flex-col items-center gap-3 rounded-md border-2 border-dashed bg-card p-8 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary',
        invalid ? 'border-destructive' : isDragging ? 'border-primary' : 'border-muted-foreground/40',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary',
        className
      )}
    >
      <CloudUpload className={cn('size-8', isDragging ? 'text-primary' : 'text-muted-foreground')} />
      <span className='text-sm font-medium text-foreground'>{title}</span>
      {hint ? <span className='text-xs text-muted-foreground'>{hint}</span> : null}
      <input
        type='file'
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className='sr-only'
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ''
        }}
      />
    </label>
  )
}
