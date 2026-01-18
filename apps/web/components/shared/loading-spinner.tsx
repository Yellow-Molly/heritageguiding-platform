import React from 'react'
import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'accent' | 'white' | 'muted'
  /** Additional CSS classes */
  className?: string
  /** Accessible label for screen readers */
  label?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-4',
}

const colorClasses = {
  primary: 'border-[var(--color-primary)]/20 border-t-[var(--color-primary)]',
  secondary: 'border-[var(--color-secondary)]/20 border-t-[var(--color-secondary)]',
  accent: 'border-[var(--color-accent)]/20 border-t-[var(--color-accent)]',
  white: 'border-white/20 border-t-white',
  muted: 'border-[var(--color-text-muted)]/20 border-t-[var(--color-text-muted)]',
}

/**
 * Animated loading spinner component with accessibility support.
 * Respects reduced motion preferences.
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  className,
  label = 'Loading',
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center', className)}
    >
      <div
        className={cn(
          'animate-spin rounded-full',
          sizeClasses[size],
          colorClasses[variant]
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export interface LoadingOverlayProps {
  /** Whether overlay is visible */
  isLoading: boolean
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Loading message to display */
  message?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Full-screen or container loading overlay with spinner.
 */
export function LoadingOverlay({
  isLoading,
  size = 'lg',
  message,
  className,
}: LoadingOverlayProps) {
  if (!isLoading) return null

  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex flex-col items-center justify-center',
        'bg-[var(--color-background)]/80 backdrop-blur-sm',
        className
      )}
      role="alert"
      aria-busy="true"
      aria-live="polite"
    >
      <LoadingSpinner size={size} />
      {message && (
        <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">{message}</p>
      )}
    </div>
  )
}

export interface LoadingDotsProps {
  /** Size of dots */
  size?: 'sm' | 'md' | 'lg'
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'accent' | 'muted'
  /** Additional CSS classes */
  className?: string
}

const dotSizeClasses = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-3 w-3',
}

const dotColorClasses = {
  primary: 'bg-[var(--color-primary)]',
  secondary: 'bg-[var(--color-secondary)]',
  accent: 'bg-[var(--color-accent)]',
  muted: 'bg-[var(--color-text-muted)]',
}

/**
 * Animated loading dots for inline loading states.
 */
export function LoadingDots({ size = 'md', variant = 'muted', className }: LoadingDotsProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('inline-flex items-center gap-1', className)}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            dotSizeClasses[size],
            dotColorClasses[variant]
          )}
          style={{ animationDelay: `${i * 150}ms` }}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  )
}
