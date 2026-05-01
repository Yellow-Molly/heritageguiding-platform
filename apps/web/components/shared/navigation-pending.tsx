'use client'

import { useLinkStatus } from 'next/link'
import { cn } from '@/lib/utils'

interface NavigationPendingProps {
  children: React.ReactNode
  /** Whether to render an overlay spinner during pending state. Off by default — caller decides. */
  showSpinner?: boolean
  className?: string
}

/**
 * Wraps the children of a parent <Link> and dims them while navigation is pending.
 * Must be rendered as a descendant of <Link> for useLinkStatus to detect pending state.
 */
export function NavigationPending({
  children,
  showSpinner = false,
  className,
}: NavigationPendingProps) {
  const { pending } = useLinkStatus()

  return (
    <div
      className={cn(
        'relative transition-opacity duration-150',
        pending && 'opacity-60 pointer-events-none',
        className
      )}
      aria-busy={pending || undefined}
    >
      {children}
      {pending && showSpinner && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white drop-shadow"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}
