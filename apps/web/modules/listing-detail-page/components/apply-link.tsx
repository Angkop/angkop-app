'use client'

import { ExternalLink } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ApplyLinkProps = {
  sourceUrl: string
  sourceName: string
}

export function ApplyLink({ sourceUrl, sourceName }: ApplyLinkProps) {
  return (
    <a
      href={sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ size: 'sm' }), 'shrink-0')}
    >
      Apply on {sourceName}
      <ExternalLink className="size-3.5" />
    </a>
  )
}
