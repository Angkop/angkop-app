'use client'

import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'

// three.js is most of this page's JavaScript, and the form does not need it, so the scene is
// fetched after the page is interactive instead of shipping inside it. The placeholder holds the
// scene's 3:2 box so nothing shifts when it arrives (the scene itself stays empty until its first
// frame is drawn, so this looks the same as before).
const CapybaraShift = dynamic(() => import('./capybara-shift').then((mod) => mod.CapybaraShift), {
  ssr: false,
  loading: () => <div className="aspect-[3/2] w-full" />
})

// The hero: a soft 3D capybara works a digital marketing desk and a construction desk in turn
// (CapybaraShift).
export function CapybaraStage({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <CapybaraShift />
    </div>
  )
}
