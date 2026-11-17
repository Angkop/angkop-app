'use client'

import { useState } from 'react'
import { Bookmark, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PlaygroundSection, Variant } from './playground-section'

const VARIANTS = ['default', 'secondary', 'outline', 'ghost', 'destructive'] as const
const SIZES = ['sm', 'default', 'lg'] as const

const CHIPS = ['Remote', 'Hybrid', 'On-site'] as const

export function ButtonsSection() {
  const [selectedChips, setSelectedChips] = useState<string[]>(['Remote'])

  function toggleChip(chip: string) {
    setSelectedChips((current) =>
      current.includes(chip) ? current.filter((item) => item !== chip) : [...current, chip]
    )
  }

  return (
    <PlaygroundSection
      id='buttons'
      title='Buttons'
      description='One primary button per screen. A loading button stays in place, turns non-interactive and says what it is doing.'
    >
      <Variant label='Variants' usage={'<Button variant="default | secondary | outline | ghost | destructive">'}>
        <div className='flex flex-wrap gap-2'>
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
      </Variant>
      <Variant label='Sizes' usage={'<Button size="sm | default | lg">'}>
        <div className='flex flex-wrap items-center gap-2'>
          {SIZES.map((size) => (
            <Button key={size} size={size}>
              {size}
            </Button>
          ))}
        </div>
      </Variant>
      <Variant label='With icon' usage='lucide-react icon before the label'>
        <div className='flex flex-wrap gap-2'>
          <Button>
            <Plus className='size-4' />
            Add Experience
          </Button>
          <Button variant='outline'>
            <Bookmark className='size-4' />
            Save Job
          </Button>
        </div>
      </Variant>
      <Variant label='Icon only, with tooltip and label' usage={'size="icon" | "icon-sm" + aria-label'}>
        <div className='flex flex-wrap items-center gap-2'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' aria-label='Save job'>
                <Bookmark className='size-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Save job</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon-sm' aria-label='Remove entry'>
                <Trash2 className='size-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove entry</TooltipContent>
          </Tooltip>
        </div>
      </Variant>
      <Variant label='Chip' usage={'<Button variant="chip" size="chip" aria-pressed={selected}>'}>
        <div className='flex flex-wrap gap-2'>
          {CHIPS.map((chip) => (
            <Button
              key={chip}
              type='button'
              variant='chip'
              size='chip'
              aria-pressed={selectedChips.includes(chip)}
              onClick={() => toggleChip(chip)}
            >
              {chip}
            </Button>
          ))}
        </div>
      </Variant>
      <Variant label='Loading' usage={'disabled + <Loader2 className="animate-spin" />'}>
        <div className='flex flex-wrap gap-2'>
          <Button disabled>
            <Loader2 className='size-4 animate-spin' />
            Saving…
          </Button>
          <Button variant='outline' disabled>
            <Loader2 className='size-4 animate-spin' />
            Loading…
          </Button>
        </div>
      </Variant>
      <Variant label='Disabled' usage='disabled'>
        <div className='flex flex-wrap gap-2'>
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} disabled>
              {variant}
            </Button>
          ))}
        </div>
      </Variant>
    </PlaygroundSection>
  )
}
