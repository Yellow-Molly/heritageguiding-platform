import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'accent' | 'outline' | 'success' | 'warning' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses = {
  default: 'bg-[var(--color-primary)] text-white',
  secondary: 'bg-[var(--color-secondary)] text-[var(--color-primary-dark)]',
  accent: 'bg-[var(--color-accent)] text-white',
  outline: 'border border-[var(--color-border)] bg-transparent text-[var(--color-text)]',
  success: 'bg-[var(--color-success)] text-white',
  warning: 'bg-[var(--color-warning)] text-[var(--color-primary-dark)]',
  destructive: 'bg-[var(--color-error)] text-white',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-sm',
}

/**
 * Badge component for displaying labels, tags, and status indicators.
 */
const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
