import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PLAYGROUND_SECTIONS, type PlaygroundSectionId } from '../constants/sections'

// A column beside the content on desktop, and the same list after the content on a phone. Each link is a page of its own
// (?section=...), so one component group shows at a time and can be linked to.
export function PlaygroundSidebar({ activeId }: { activeId: PlaygroundSectionId }) {
  return (
    <nav
      aria-label='Playground sections'
      className='order-last flex flex-col gap-1 border-t border-border pt-4 md:order-none md:sticky md:top-8 md:self-start md:border-t-0 md:pt-0'
    >
      {PLAYGROUND_SECTIONS.map((section) => (
        <Link
          key={section.id}
          href={`/components-playground?section=${section.id}`}
          aria-current={section.id === activeId ? 'page' : undefined}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
            section.id === activeId
              ? 'bg-accent font-medium text-accent-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {section.title}
        </Link>
      ))}
    </nav>
  )
}
