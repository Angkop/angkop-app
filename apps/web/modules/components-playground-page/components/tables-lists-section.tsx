'use client'

import { useState } from 'react'
import { APPLICATION_STATUS_LABELS } from '@angkop/shared'
import { EmptyState } from '@/components/common/empty-state'
import { PaginationControls } from '@/components/pagination-controls'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SAMPLE_APPLICATION_ROWS } from '../constants/sample-data'
import { PlaygroundSection, Variant } from './playground-section'

const COLUMN_COUNT = 3
const LOADING_ROWS = 3
const SAMPLE_PAGE_COUNT = 5

export function TablesListsSection() {
  const [page, setPage] = useState(2)

  return (
    <PlaygroundSection
      id='tables-lists'
      title='Tables and Lists'
      description='Tables scroll sideways inside their own box on a phone, so the page itself never does. Sorting goes through column headers, and paging is server-side.'
    >
      <Variant label='Table with rows' usage='<Table><TableHeader /><TableBody /></Table>' wide>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SAMPLE_APPLICATION_ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell className='font-medium'>{row.title}</TableCell>
                <TableCell className='text-muted-foreground'>{row.company}</TableCell>
                <TableCell>
                  <Badge variant='outline'>{APPLICATION_STATUS_LABELS[row.status]}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Variant>
      <Variant label='Table, loading' usage='Skeleton cells in each row'>
        <Table>
          <TableBody>
            {Array.from({ length: LOADING_ROWS }, (_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: COLUMN_COUNT }, (_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className='h-4 w-full' />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Variant>
      <Variant label='Table, empty' usage='EmptyState in place of the body'>
        <EmptyState
          title='No applications yet'
          description='Save a job and set its status to Applied to track it here.'
          className='p-5'
        />
      </Variant>
      <Variant label='Tabs' usage='<Tabs><TabsList /><TabsContent /></Tabs>'>
        <Tabs defaultValue='saved'>
          <TabsList>
            <TabsTrigger value='saved'>Saved</TabsTrigger>
            <TabsTrigger value='applied'>Applied</TabsTrigger>
            <TabsTrigger value='closed' disabled>
              Closed
            </TabsTrigger>
          </TabsList>
          <TabsContent value='saved'>
            <p className='text-sm text-muted-foreground'>Jobs you bookmarked.</p>
          </TabsContent>
          <TabsContent value='applied'>
            <p className='text-sm text-muted-foreground'>Jobs you applied to.</p>
          </TabsContent>
        </Tabs>
      </Variant>
      <Variant label='Pagination' usage='<PaginationControls page pageCount onChange />'>
        <PaginationControls page={page} pageCount={SAMPLE_PAGE_COUNT} onChange={setPage} />
      </Variant>
    </PlaygroundSection>
  )
}
