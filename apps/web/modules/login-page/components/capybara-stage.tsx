'use client'

import { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { THOUGHTS } from '../constants'
import { CapybaraHero } from './capybara-hero'

// three.js is only worth downloading on this one screen, and only in the browser.
const Capybara3D = dynamic(() => import('./capybara-3d').then((mod) => mod.Capybara3D), { ssr: false })

// The flat capybara holds the space (and stays for reduced motion or no WebGL); the 3D one
// takes over once it has drawn its first frame. Its thoughts pop up beside its head one at a
// time (angkop-slide in globals.css); with reduced motion only the first one shows.
export function CapybaraStage({ className }: { className?: string }) {
  const [isReady, setIsReady] = useState(false)
  const handleReady = useCallback(() => setIsReady(true), [])

  return (
    <div className={cn('relative', className)}>
      <CapybaraHero className={cn('w-full', isReady && 'invisible')} />
      <Capybara3D onReady={handleReady} />

      <div aria-hidden="true" className="absolute right-[46%] bottom-[96%] hidden lg:block">
        {THOUGHTS.map((thought, index) => (
          <div
            key={thought.text}
            className={cn(
              'absolute right-0 bottom-0 w-max opacity-0 animate-[angkop-slide_12s_ease-in-out_infinite]',
              thought.delay,
              index === 0 ? 'motion-reduce:opacity-100' : 'motion-reduce:hidden'
            )}
          >
            <p className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-lg">
              {thought.text}
            </p>
            <span className="absolute top-full right-5 mt-1.5 size-3 rounded-full border border-border bg-background shadow-sm" />
            <span className="absolute top-full right-2 mt-5 size-1.5 rounded-full border border-border bg-background" />
          </div>
        ))}
      </div>
    </div>
  )
}
