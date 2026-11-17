'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatFileSize } from './format-file-size'

function FileThumbnail({ file }: { file: File }) {
  const [previewUrl, setPreviewUrl] = useState('')
  const isImage = file.type.startsWith('image/')

  useEffect(() => {
    if (!isImage) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file, isImage])

  if (isImage && previewUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a local blob preview, not a remote image next/image could optimize
      <img
        src={previewUrl}
        alt={file.name}
        className='size-[72px] shrink-0 rounded-md border border-border object-contain'
      />
    )
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toUpperCase() : 'FILE'
  return (
    <span className='flex size-[72px] shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground'>
      {extension}
    </span>
  )
}

// The files picked so far, each with a 72px preview (an image thumbnail, or its extension), its
// name and size, and a remove button.
export function FilePreviewList({ files, onRemove }: { files: File[]; onRemove?: (file: File) => void }) {
  return (
    <ul className='space-y-2'>
      {files.map((file) => (
        <li
          key={`${file.name}-${file.lastModified}`}
          className='flex items-center gap-4 rounded-md border border-border p-3'
        >
          <FileThumbnail file={file} />
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium text-foreground'>{file.name}</p>
            <p className='text-xs text-muted-foreground'>{formatFileSize(file.size)}</p>
          </div>
          {onRemove ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => onRemove(file)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className='size-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove file</TooltipContent>
            </Tooltip>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
