'use client'

import clsx from 'clsx'

export interface TocEntry {
  id: string
  number: string
  title: string
}

interface TocItemProps {
  entry: TocEntry
  active?: boolean
  onClick?: (id: string) => void
}

/**
 * Single ToC entry. Default / hover / active states. Number prefix in gold.
 */
export function TocItem({ entry, active = false, onClick }: TocItemProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onClick) return
    // Let modifier-clicks fall through so cmd/ctrl/middle-click can open the
    // anchor in a new tab and shift-click can open in a new window.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    onClick(entry.id)
  }
  return (
    <a
      href={`#${entry.id}`}
      onClick={handleClick}
      aria-current={active ? 'location' : undefined}
      className={clsx(
        'group flex items-baseline gap-2.5 rounded-md px-3 py-2.5 transition-colors duration-150',
        active
          ? 'border-l-[3px] border-[var(--color-secondary)] bg-[var(--color-background)] pl-2 text-[var(--color-primary)]'
          : 'border-l-[3px] border-transparent pl-2 text-[var(--color-text)] hover:bg-[var(--color-background)]'
      )}
    >
      <span className="text-xs font-semibold tracking-[0.08em] text-[var(--color-secondary)]">
        {entry.number}
      </span>
      <span className="text-sm leading-tight" style={{ hyphens: 'auto', wordBreak: 'break-word' }}>
        {entry.title}
      </span>
    </a>
  )
}
