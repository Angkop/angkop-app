'use client'

import { useState } from 'react'
import { FileText, Info, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogIconBadge,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PlaygroundSection, Variant } from './playground-section'

const CONFIRM_DELAY_MS = 1200

export function OverlaysSection() {
  const [destructiveOpen, setDestructiveOpen] = useState(false)
  const [primaryOpen, setPrimaryOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  // Stands in for a mutation, so the confirming (loading) state can be seen.
  function confirmWithDelay() {
    setIsConfirming(true)
    setTimeout(() => {
      setIsConfirming(false)
      setDestructiveOpen(false)
    }, CONFIRM_DELAY_MS)
  }

  return (
    <PlaygroundSection
      id='overlays'
      title='Modals and Popovers'
      description='Destructive actions confirm first and name what will be affected.'
    >
      <Variant label='Dialog' usage='<Dialog><DialogTrigger /><DialogContent /></Dialog>'>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant='outline'>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent className='max-w-sm'>
            <DialogHeader>
              <div className='flex items-start gap-3'>
                <DialogIconBadge icon={FileText} />
                <div className='min-w-0 flex-1 space-y-1 pt-0.5'>
                  <DialogTitle>Import your resume</DialogTitle>
                  <DialogDescription>Upload a PDF or DOCX and we will fill in your profile.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <p className='text-sm text-muted-foreground'>
              Everything between the header and the footer gets the same 24px side padding.
            </p>
            <DialogFooter>
              <Button variant='outline'>Cancel</Button>
              <Button>Choose File</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Variant>
      <Variant
        label='Confirm dialog, destructive and loading'
        usage="<ConfirmDialog confirmVariant='destructive' isConfirming />"
      >
        <Button variant='outline' onClick={() => setDestructiveOpen(true)}>
          Open Destructive Confirm
        </Button>
        <ConfirmDialog
          open={destructiveOpen}
          onOpenChange={setDestructiveOpen}
          title='Remove Junior Frontend Engineer?'
          description='This removes the job from your saved list. Its tags and interview date go with it.'
          confirmLabel='Remove Job'
          confirmingLabel='Removing…'
          isConfirming={isConfirming}
          onConfirm={confirmWithDelay}
        />
      </Variant>
      <Variant label='Confirm dialog, primary' usage="confirmVariant='default'">
        <Button variant='outline' onClick={() => setPrimaryOpen(true)}>
          Open Primary Confirm
        </Button>
        <ConfirmDialog
          open={primaryOpen}
          onOpenChange={setPrimaryOpen}
          title='Replace your skills?'
          description='Importing this resume replaces the skills on your profile.'
          confirmLabel='Replace Skills'
          confirmVariant='default'
          onConfirm={() => setPrimaryOpen(false)}
        />
      </Variant>
      <Variant label='Sheet' usage='<Sheet><SheetTrigger /><SheetContent /></Sheet>'>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant='outline'>Open Sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Why this is a match</SheetTitle>
              <SheetDescription>The skills and wording that lifted this score.</SheetDescription>
            </SheetHeader>
            <SheetBody>
              <p className='text-sm text-muted-foreground'>Sheet body content scrolls here.</p>
            </SheetBody>
          </SheetContent>
        </Sheet>
      </Variant>
      <Variant label='Popover' usage='<Popover><PopoverTrigger /><PopoverContent /></Popover>'>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline'>
              <Info className='size-4' />
              Show Details
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <p className='text-sm text-muted-foreground'>Popover content sits on the popover surface token.</p>
          </PopoverContent>
        </Popover>
      </Variant>
      <Variant label='Tooltip' usage='<Tooltip><TooltipTrigger /><TooltipContent /></Tooltip>'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='outline'>Hover or Focus Me</Button>
          </TooltipTrigger>
          <TooltipContent>A short hint, not a place for required information</TooltipContent>
        </Tooltip>
      </Variant>
      <Variant
        label='Dropdown menu'
        usage='<DropdownMenu><DropdownMenuTrigger /><DropdownMenuContent /></DropdownMenu>'
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='icon' aria-label='More actions'>
              <MoreHorizontal className='size-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Profile settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Variant>
      <Variant label='Toast' usage='toast.success(title, { description }) / toast.error(...)'>
        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' onClick={() => toast.success('Status updated to Applied')}>
            Show Success Toast
          </Button>
          <Button
            variant='outline'
            onClick={() =>
              toast.error('Could not save the job', { description: 'Check your connection and try again.' })
            }
          >
            Show Error Toast
          </Button>
        </div>
      </Variant>
      <Variant label='Accordion' usage="<Accordion type='single' collapsible>" wide>
        <Accordion type='single' collapsible>
          <AccordionItem value='why'>
            <AccordionTrigger>How is the score calculated?</AccordionTrigger>
            <AccordionContent>It blends semantic similarity with what similar users did with the job.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </Variant>
    </PlaygroundSection>
  )
}
