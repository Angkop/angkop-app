import type { Metadata } from 'next'
import { ComponentsPlaygroundPage } from '@/modules/components-playground-page/components-playground-page'

// Reached only by typing the URL: no nav link points here, and it is kept out of search.
export const metadata: Metadata = {
  title: 'Components Playground',
  robots: { index: false, follow: false }
}

type PlaygroundSearchParams = Promise<{ section?: string }>

export default async function ComponentsPlayground({ searchParams }: { searchParams: PlaygroundSearchParams }) {
  const { section } = await searchParams
  return <ComponentsPlaygroundPage section={section} />
}
