import { cn } from '@/lib/utils'
import { CapybaraShift } from './capybara-shift'

// The hero: a soft 3D capybara works a digital marketing desk and a construction desk in turn
// (CapybaraShift).
export function CapybaraStage({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <CapybaraShift />
    </div>
  )
}
