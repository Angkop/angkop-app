import type { ComponentType } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { buttonVariants } from '@/components/ui/button'
import { BadgesSection } from './components/badges-section'
import { ButtonsSection } from './components/buttons-section'
import { CardsSection } from './components/cards-section'
import { EmptyStatesSection } from './components/empty-states-section'
import { FieldsSection } from './components/fields-section'
import { LoadersSection } from './components/loaders-section'
import { OverlaysSection } from './components/overlays-section'
import { PlaygroundSidebar } from './components/playground-sidebar'
import { SelectsFiltersSection } from './components/selects-filters-section'
import { TablesListsSection } from './components/tables-lists-section'
import { UploadsSection } from './components/uploads-section'
import { DEFAULT_PLAYGROUND_SECTION, PLAYGROUND_SECTIONS, type PlaygroundSectionId } from './constants/sections'

const SECTION_COMPONENTS: Record<PlaygroundSectionId, ComponentType> = {
  fields: FieldsSection,
  buttons: ButtonsSection,
  'selects-filters': SelectsFiltersSection,
  cards: CardsSection,
  badges: BadgesSection,
  loaders: LoadersSection,
  'empty-states': EmptyStatesSection,
  overlays: OverlaysSection,
  uploads: UploadsSection,
  'tables-lists': TablesListsSection
}

function isSectionId(value: string | undefined): value is PlaygroundSectionId {
  return PLAYGROUND_SECTIONS.some((section) => section.id === value)
}

export function ComponentsPlaygroundPage({ section }: { section?: string }) {
  const activeId = isSectionId(section) ? section : DEFAULT_PLAYGROUND_SECTION
  const ActiveSection = SECTION_COMPONENTS[activeId]

  return (
    <main className='mx-auto max-w-6xl px-4 py-8'>
      <Link href='/' className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mb-4 -ml-3' })}>
        <ArrowLeft className='size-4' />
        Back to Home
      </Link>
      <PageHeader
        title='Components Playground'
        description='Every shared component with its variants and states. Check a new screen against this page before building a local copy.'
      />
      <div className='flex flex-col gap-6 md:grid md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8'>
        <PlaygroundSidebar activeId={activeId} />
        <ActiveSection />
      </div>
    </main>
  )
}
