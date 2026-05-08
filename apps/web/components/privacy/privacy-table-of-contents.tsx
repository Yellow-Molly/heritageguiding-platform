'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { X, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PrivacyTableOfContentsProps } from './types'

/**
 * Table of contents — desktop sticky sidebar + mobile drawer.
 * Phase 4 adds IntersectionObserver scroll-spy, smooth scroll with header
 * offset, body-scroll lock while drawer open, Escape-to-close, focus return.
 */
export function PrivacyTableOfContents({ items, title, closeLabel }: PrivacyTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [items])

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  // Return focus to trigger after drawer closes (only if it was previously open)
  useEffect(() => {
    if (!drawerOpen && wasOpenRef.current && triggerRef.current) {
      triggerRef.current.focus()
    }
    wasOpenRef.current = drawerOpen
  }, [drawerOpen])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault()
      setDrawerOpen(false)
      const target = document.getElementById(id)
      if (!target) return
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const headerVar = getComputedStyle(document.documentElement).getPropertyValue('--header-height')
      const headerOffset = parseFloat(headerVar) * (headerVar.includes('rem') ? 16 : 1) || 80
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset - 24
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' })
      setActiveId(id)
      if (typeof history !== 'undefined') {
        history.pushState(null, '', `#${id}`)
      }
    },
    [],
  )

  return (
    <>
      {/* Mobile: sticky pill trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="sticky top-[var(--header-height)] z-30 flex w-full items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)] lg:hidden"
        aria-haspopup="dialog"
        aria-expanded={drawerOpen}
      >
        <List className="h-4 w-4" />
        <span>{title}</span>
      </button>

      {/* Desktop sidebar */}
      <nav
        aria-label={title}
        className="hidden lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:block lg:h-fit"
      >
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {title}
        </h2>
        <ul className="space-y-1">
          {items.map((it) => {
            const isActive = activeId === it.id
            return (
              <li key={it.id}>
                <a
                  href={`#${it.id}`}
                  onClick={(e) => handleClick(e, it.id)}
                  className={cn(
                    'group flex items-start gap-3 rounded-md py-2 pl-3 pr-2 text-sm transition-colors',
                    'hover:bg-[var(--color-background-alt)]',
                    isActive
                      ? 'border-l-[3px] border-[var(--color-secondary-light)] bg-[var(--color-background-alt)] font-semibold text-[var(--color-primary)]'
                      : 'border-l-[3px] border-transparent text-[var(--color-text-muted)]',
                  )}
                  aria-current={isActive ? 'location' : undefined}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold',
                      isActive
                        ? 'bg-[var(--color-secondary-light)] text-[var(--color-primary)]'
                        : 'bg-[var(--color-border-light)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-secondary-light)] group-hover:text-[var(--color-primary)]',
                    )}
                  >
                    {it.numeral}
                  </span>
                  <span className="leading-snug">{it.label}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex flex-col bg-[var(--color-surface)] lg:hidden"
        >
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <h2 className="font-semibold text-[var(--color-primary)]">{title}</h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label={closeLabel}
              className="rounded-md p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-background-alt)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ul className="flex-1 space-y-1 overflow-y-auto p-4">
            {items.map((it) => (
              <li key={it.id}>
                <a
                  href={`#${it.id}`}
                  onClick={(e) => handleClick(e, it.id)}
                  className="flex items-center gap-3 rounded-md p-3 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-background-alt)]"
                >
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[var(--color-secondary-light)] text-xs font-semibold text-[var(--color-primary)]">
                    {it.numeral}
                  </span>
                  <span>{it.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
