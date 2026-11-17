import { cn } from '@/lib/utils'

// Three pulsing dots, for a bubble that is still working something out.
export function ThinkingDots({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-1.5', className)}>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className={cn(
            'size-2 animate-pulse rounded-full bg-muted-foreground/40',
            dot === 1 && '[animation-delay:150ms]',
            dot === 2 && '[animation-delay:300ms]'
          )}
        />
      ))}
    </div>
  )
}
