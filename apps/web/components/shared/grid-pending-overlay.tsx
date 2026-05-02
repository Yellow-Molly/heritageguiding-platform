'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GridPendingOverlayProps {
  isPending: boolean
  className?: string
}

/**
 * Absolute-positioned overlay rendered inside a `relative` grid wrapper.
 * Fades in while filter changes are flying to the server, fades out when resolved.
 *
 * Pair with: parent `relative`, grid wrapper applying
 * `isPending && 'opacity-50 pointer-events-none'` for the dim effect.
 */
export function GridPendingOverlay({ isPending, className }: GridPendingOverlayProps) {
  return (
    <div
      aria-busy={isPending}
      aria-hidden={!isPending}
      className={cn(
        'pointer-events-none absolute inset-0 z-10 flex items-center justify-center',
        'bg-background/40 transition-opacity duration-150',
        isPending ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      {isPending && (
        <Loader2 className="size-8 animate-spin text-[var(--color-primary)]" />
      )}
    </div>
  )
}
