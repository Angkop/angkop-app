import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:opacity-80',
        outline: 'border border-primary bg-transparent text-primary hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:opacity-80',
        ghost: 'text-foreground hover:bg-muted',
        destructive: 'bg-destructive text-white hover:opacity-80'
      },
      size: {
        default: 'h-9 px-[25px] py-2',
        sm: 'h-8 px-4 text-xs',
        lg: 'h-[42px] px-[25px] text-[15px]',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { ref?: React.Ref<HTMLButtonElement> }

// `ref` is destructured as a plain prop (React 19 no longer needs forwardRef for this) so
// Radix's TooltipTrigger/DialogTrigger `asChild` can attach its own ref to the real <button>.
export function Button({ className, variant, size, ref, ...props }: ButtonProps) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
}
