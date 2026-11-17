'use client'

import { Bookmark, Search } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorMessage } from '@/components/error-message'
import { RouteError } from '@/components/route-error'
import { Button } from '@/components/ui/button'
import { PlaygroundSection, Variant } from './playground-section'

export function EmptyStatesSection() {
  return (
    <PlaygroundSection
      id='empty-states'
      title='Empty and Error States'
      description='Every empty state says why the area is empty and what to do next. A failed query shows an error with a retry, never a blank area.'
    >
      <Variant label='Empty state' usage='<EmptyState title description />'>
        <EmptyState
          title='No saved jobs yet'
          description='Save a job from your matches and it will show up here so you can track it.'
        />
      </Variant>
      <Variant label='Empty state with icon and action' usage='icon={Search} action={<Button />}'>
        <EmptyState
          icon={Search}
          title='No jobs match these filters'
          description='Try a different search, source or skill, or clear the filters.'
          action={
            <Button variant='outline' size='sm'>
              Clear Filters
            </Button>
          }
        />
      </Variant>
      <Variant label='Empty state, compact icon' usage='icon={Bookmark}'>
        <EmptyState
          icon={Bookmark}
          title='Nothing tagged'
          description='Add a tag such as Dream job to find this application again.'
          className='p-5'
        />
      </Variant>
      <Variant label='Inline error with retry' usage='<ErrorMessage onRetry retryLabel>'>
        <ErrorMessage onRetry={() => new Promise((resolve) => setTimeout(resolve, 800))} retryLabel='Reload Matches'>
          We could not load your matches.
        </ErrorMessage>
      </Variant>
      <Variant label='Inline error, no retry' usage='<ErrorMessage>'>
        <ErrorMessage>That email address is already in use.</ErrorMessage>
      </Variant>
      <Variant label='Route error' usage='<RouteError title onReset />'>
        <RouteError title='We could not load this page' onReset={() => undefined} />
      </Variant>
    </PlaygroundSection>
  )
}
