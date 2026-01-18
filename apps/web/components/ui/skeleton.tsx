import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Skeleton variant */
  variant?: 'default' | 'circular' | 'rounded'
}

/**
 * Skeleton loading placeholder with animated pulse effect.
 * Respects reduced motion preferences.
 */
function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  const variantClasses = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--color-border)]',
        variantClasses[variant],
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

/**
 * Skeleton card for tour card loading states.
 */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 rounded-xl border border-[var(--color-border)] p-4', className)}>
      <Skeleton className="h-48 w-full" variant="rounded" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8" variant="circular" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}

/**
 * Skeleton text for paragraph loading states.
 */
function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton avatar for user/guide loading states.
 */
function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  return <Skeleton className={cn(sizeClasses[size], className)} variant="circular" />
}

export { Skeleton, SkeletonCard, SkeletonText, SkeletonAvatar }
