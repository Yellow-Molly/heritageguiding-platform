import Link from 'next/link'
import { ChevronRight, type LucideIcon } from 'lucide-react'

interface InlineCrossLinkCardProps {
  icon: LucideIcon
  title: string
  description: string
  href: string
}

/**
 * Generic inline cross-link card. Horizontal: icon + text + chevron.
 * Used in T&C §07 (→ /cancellation), §15 (→ /privacy), and similar contexts.
 */
export function InlineCrossLinkCard({
  icon: Icon,
  title,
  description,
  href,
}: InlineCrossLinkCardProps) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-lg bg-[var(--color-background-alt)] px-5 py-4 transition-all duration-200 hover:bg-[var(--color-surface)] hover:shadow-sm"
    >
      <Icon
        width={20}
        height={20}
        aria-hidden="true"
        className="flex-shrink-0 text-[var(--color-secondary)]"
      />
      <div className="flex-1">
        <p className="m-0 text-sm font-semibold text-[var(--color-primary)]">{title}</p>
        <p className="m-0 mt-0.5 text-sm text-[var(--color-text-muted)]">{description}</p>
      </div>
      <ChevronRight
        width={18}
        height={18}
        aria-hidden="true"
        className="flex-shrink-0 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  )
}
