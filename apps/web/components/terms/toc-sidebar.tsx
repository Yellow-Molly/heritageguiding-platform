'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { TocItem, type TocEntry } from './toc-item'

interface TocSidebarProps {
  items: TocEntry[]
  /** Eyebrow label, e.g. "ON THIS PAGE" */
  eyebrow: string
  /** Mobile accordion trigger label, e.g. "Jump to section" */
  jumpToLabel: string
}

/**
 * Sticky-on-desktop / horizontal-grid-on-tablet / accordion-on-mobile ToC.
 * IntersectionObserver scrollspy updates active item as user scrolls.
 */
export function TocSidebar({ items, eyebrow, jumpToLabel }: TocSidebarProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '')
  const [mobileOpen, setMobileOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    if (sections.length === 0) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-15% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    sections.forEach((section) => observerRef.current?.observe(section))
    return () => observerRef.current?.disconnect()
  }, [items])

  const handleClick = (id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })
    setMobileOpen(false)
    setActiveId(id)
    // replaceState (not pushState) — avoid polluting history with each anchor click
    if (typeof window !== 'undefined' && window.history.replaceState) {
      window.history.replaceState(null, '', `#${id}`)
    }
  }

  const activeEntry = items.find((item) => item.id === activeId) ?? items[0]

  return (
    <aside
      className="terms-toc-sidebar lg:sticky lg:top-24 lg:self-start"
      aria-label={eyebrow}
    >
      {/* Mobile accordion trigger (<md). Nav is always rendered (just hidden
          when collapsed) so aria-controls always references a real element. */}
      <div className="md:hidden">
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="terms-toc-list-mobile"
          onClick={() => setMobileOpen((s) => !s)}
          className="flex w-full items-center justify-between rounded-lg bg-[var(--color-background-alt)] px-4 py-3 text-left"
        >
          <span className="flex items-baseline gap-2">
            <span className="text-xs font-semibold tracking-[0.16em] text-[var(--color-text-muted)]">
              {jumpToLabel}
            </span>
            <span className="text-sm font-medium text-[var(--color-primary)]">
              {activeEntry?.number} · {activeEntry?.title}
            </span>
          </span>
          <ChevronDown
            width={18}
            height={18}
            aria-hidden
            className={`transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <nav
          id="terms-toc-list-mobile"
          hidden={!mobileOpen}
          className="mt-2 rounded-lg bg-[var(--color-background-alt)] p-3"
        >
          <ul className="flex flex-col gap-0.5">
            {items.map((entry) => (
              <li key={entry.id}>
                <TocItem entry={entry} active={entry.id === activeId} onClick={handleClick} />
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Tablet horizontal grid (md to <lg) */}
      <nav
        aria-label={eyebrow}
        className="hidden rounded-xl bg-[var(--color-background-alt)] p-6 md:block lg:hidden"
      >
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          {eyebrow}
        </p>
        <div className="mt-2 mb-4 h-0.5 w-8 bg-[var(--color-secondary)]" />
        <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          {items.map((entry) => (
            <li key={entry.id}>
              <TocItem entry={entry} active={entry.id === activeId} onClick={handleClick} />
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop sidebar (lg+) */}
      <nav
        aria-label={eyebrow}
        className="hidden rounded-xl bg-[var(--color-background-alt)] p-6 lg:block"
      >
        <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
          {eyebrow}
        </p>
        <div className="mt-2 mb-4 h-0.5 w-8 bg-[var(--color-secondary)]" />
        <ul className="flex flex-col gap-0.5">
          {items.map((entry) => (
            <li key={entry.id}>
              <TocItem entry={entry} active={entry.id === activeId} onClick={handleClick} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
