'use client'

import { useState } from 'react'
import { FileDropzone } from '@/components/common/file-upload/file-dropzone'
import { FilePreviewList } from '@/components/common/file-upload/file-preview-list'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger
} from '@/components/ui/dialog'
import { PlaygroundSection, Variant } from './playground-section'

const MAX_SIZE_MB = 10
const BYTES_PER_MB = 1024 * 1024

export function UploadsSection() {
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [dialogFile, setDialogFile] = useState<File | null>(null)

  // The dropzone only hands files back, so the size check lives with the caller.
  function handleSelected(selected: File[]) {
    const tooLarge = selected.find((file) => file.size > MAX_SIZE_MB * BYTES_PER_MB)
    if (tooLarge) {
      setError(`${tooLarge.name} is over ${MAX_SIZE_MB} MB. Choose a smaller file.`)
      return
    }
    setError('')
    setFiles((current) => [...current, ...selected])
  }

  return (
    <PlaygroundSection
      id='uploads'
      title='File Uploads'
      description='A dashed drop zone and a preview list. The zone hands files back and the caller checks type and size, since every upload has its own rules.'
    >
      <Variant label='Drop zone, multiple files' usage='<FileDropzone multiple onFilesSelected hint />'>
        <div className='space-y-3'>
          <FileDropzone
            multiple
            hint={`Any file, up to ${MAX_SIZE_MB} MB`}
            invalid={Boolean(error)}
            onFilesSelected={handleSelected}
          />
          {error ? <p className='text-xs text-destructive'>{error}</p> : null}
        </div>
      </Variant>
      <Variant label='Preview list with remove' usage='<FilePreviewList files onRemove />'>
        {files.length > 0 ? (
          <FilePreviewList
            files={files}
            onRemove={(file) => setFiles((current) => current.filter((item) => item !== file))}
          />
        ) : (
          <p className='text-xs text-muted-foreground'>
            Choose a file on the left and it is listed here, with a thumbnail for images.
          </p>
        )}
      </Variant>
      <Variant label='Drop zone, disabled' usage='disabled'>
        <FileDropzone disabled hint='Uploads are paused' onFilesSelected={() => undefined} />
      </Variant>
      <Variant label='Drop zone, error' usage='invalid'>
        <FileDropzone invalid hint='PDF or DOCX, up to 10MB' onFilesSelected={() => undefined} />
      </Variant>
      <Variant label='Upload dialog' usage='<Dialog> with FileDropzone and FilePreviewList' wide>
        <Dialog onOpenChange={(open) => !open && setDialogFile(null)}>
          <DialogTrigger asChild>
            <Button variant='outline'>Open Upload Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader title='Import from resume' description='Upload a PDF or DOCX and we will fill in your profile.' />
            {dialogFile ? (
              <FilePreviewList files={[dialogFile]} onRemove={() => setDialogFile(null)} />
            ) : (
              <FileDropzone
                accept='.pdf,.docx'
                hint='PDF or DOCX, up to 10MB'
                onFilesSelected={(selected) => setDialogFile(selected[0])}
              />
            )}
            <DialogFooter>
              <Button variant='outline'>Cancel</Button>
              <Button disabled={!dialogFile}>Upload Resume</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Variant>
    </PlaygroundSection>
  )
}
