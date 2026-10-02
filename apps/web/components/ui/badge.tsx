import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', {
  variants: {
    variant: {
      default: 'bg-secondary text-secondary-foreground',
      outline: 'border border-border text-foreground',
      secondary: 'gap-1 bg-secondary pr-1 text-secondary-foreground',
      strong: 'bg-match-strong text-match-strong-foreground',
      partial: 'bg-match-partial text-match-partial-foreground',
      weak: 'bg-match-weak text-match-weak-foreground'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />
}
