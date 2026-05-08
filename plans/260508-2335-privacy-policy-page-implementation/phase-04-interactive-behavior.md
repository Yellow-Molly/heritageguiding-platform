# Phase 04 — Interactive Behavior

## Context Links
- Plan: [plan.md](./plan.md)
- Depends on: Phase 3 (page composition)
- Pattern reference: `apps/web/components/tour-detail/*` (existing IntersectionObserver patterns), `prefers-reduced-motion` handling site-wide

## Overview
- **Priority:** Medium
- **Status:** Pending
- **Effort:** ~2-3h
- Add scroll-spy + mobile drawer to TOC. Accordion uses native `<details>` (no JS) but enhance with smooth-scroll on `summary` click.

## Key Insights
- `privacy-table-of-contents.tsx` is the only client component requiring stateful logic.
- Native `<details>`/`<summary>` covers accordion expand/collapse — no client component needed for `privacy-rights-accordion.tsx` unless animation desired (deferred).
- IntersectionObserver pattern already used in `tour-grid-layout.tsx` and `guide-grid-client.tsx` — reuse.
- Mobile drawer: simple state toggle + body-scroll-lock + Escape-key handler.
- Respect `prefers-reduced-motion`: smooth scroll only when not set.

## Requirements

### Scroll-Spy (Desktop ≥1024px)
- Sticky sidebar TOC observes 14 section anchors
- Active section gets gold left border (3px `border-[var(--color-secondary-light)]`) + bolder text + gold numeral chip emphasis
- Updates within 200ms of section entering viewport
- Handles initial load (active = first section if at top, last section if at bottom)

### Mobile Drawer (≤767px)
- "Jump to section" pill triggers full-screen overlay
- Drawer animates in from right (translate + fade) at 300ms — disabled if reduced-motion
- Click outside drawer or Escape key closes it
- Click on item: close drawer + smooth-scroll to anchor (not native jump — accounts for sticky header offset)
- Body scroll locked while drawer open
- Focus trapped within drawer (basic: focus first item on open, return focus to trigger on close)

### Smooth Scroll
- All TOC anchor clicks (desktop + mobile) intercept default jump behavior
- Use `element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })`
- Offset for sticky header: scroll target is `section.offsetTop - headerHeight - 24px buffer`

## Implementation Spec

### `privacy-table-of-contents.tsx` (full implementation)

```tsx
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { X, List } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TocItem { id: string; numeral: string; label: string }
interface Props {
  items: TocItem[]
  title: string
  closeLabel: string
}

export function PrivacyTableOfContents({ items, title, closeLabel }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Scroll-spy via IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sections = items
      .map(it => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    sections.forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [items])

  // Drawer escape handler + body scroll lock
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  // Return focus to trigger when drawer closes
  useEffect(() => {
    if (!drawerOpen && triggerRef.current) {
      triggerRef.current.focus()
    }
  }, [drawerOpen])

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setDrawerOpen(false)
    const target = document.getElementById(id)
    if (!target) return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const headerOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '64', 10)
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset - 24
    window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' })
    setActiveId(id)
    history.pushState(null, '', `#${id}`)
  }, [])

  return (
    <>
      {/* Mobile: sticky pill trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden sticky top-[var(--header-height)] z-30 flex w-full items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]"
        aria-haspopup="dialog"
        aria-expanded={drawerOpen}
      >
        <List className="h-4 w-4" />
        <span>{title}</span>
      </button>

      {/* Desktop sidebar */}
      <nav
        aria-label={title}
        className="hidden lg:block lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:h-fit"
      >
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          {title}
        </h2>
        <ul className="space-y-1">
          {items.map(it => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                onClick={e => handleClick(e, it.id)}
                className={cn(
                  'group flex items-start gap-3 rounded-md py-2 pl-3 pr-2 text-sm transition-colors',
                  'hover:bg-[var(--color-background-alt)]',
                  activeId === it.id
                    ? 'border-l-[3px] border-[var(--color-secondary-light)] bg-[var(--color-background-alt)] font-semibold text-[var(--color-primary)]'
                    : 'border-l-[3px] border-transparent text-[var(--color-text-muted)]'
                )}
                aria-current={activeId === it.id ? 'location' : undefined}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold',
                    activeId === it.id
                      ? 'bg-[var(--color-secondary-light)] text-[var(--color-primary)]'
                      : 'bg-[var(--color-border-light)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-secondary-light)] group-hover:text-[var(--color-primary)]'
                  )}
                >
                  {it.numeral}
                </span>
                <span className="leading-snug">{it.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="lg:hidden fixed inset-0 z-50 flex flex-col bg-[var(--color-surface)]"
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
          <ul className="flex-1 overflow-y-auto p-4 space-y-1">
            {items.map(it => (
              <li key={it.id}>
                <a
                  href={`#${it.id}`}
                  onClick={e => handleClick(e, it.id)}
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
```

## Implementation Steps
1. Replace the static skeleton from Phase 1 with the full client component above
2. Verify `--header-height` CSS variable exists (already in globals.css per cancellation page usage)
3. Test scroll-spy at desktop: scroll through page, verify active border updates correctly
4. Test mobile drawer: tap pill, verify overlay opens, item click closes + scrolls
5. Test keyboard: Tab through TOC items, Enter activates, Escape closes drawer
6. Test reduced-motion: enable in OS, verify instant scroll instead of smooth
7. Test all 3 locales — DE long labels must wrap correctly within 260px sidebar

## Todo List
- [ ] Replace `privacy-table-of-contents.tsx` with full client implementation
- [ ] Verify scroll-spy active state updates correctly
- [ ] Verify mobile drawer opens/closes via button + Escape
- [ ] Verify smooth scroll respects `prefers-reduced-motion`
- [ ] Verify focus returns to trigger after drawer close
- [ ] Verify body scroll locks while drawer open
- [ ] Test in SV/EN/DE — DE labels (longest) wrap without overflow

## Success Criteria
- TOC active state updates as user scrolls
- Mobile drawer functional (open, close, item click, Escape, click-outside not required for v1)
- All anchor links scroll smoothly with header offset
- No console errors in any locale
- Lighthouse a11y score not regressed (≥95)
- axe-core scan: zero violations on TOC component

## Risk Assessment
| Risk | Mitigation |
|---|---|
| IntersectionObserver flickers between adjacent sections | rootMargin `-20% 0px -60% 0px` biases to top-of-viewport active state |
| `--header-height` value drift | Read at runtime via `getComputedStyle`; fallback to 64 |
| Drawer focus trap incomplete | v1 uses simple focus-first-on-open + return-on-close; full focus trap deferred to v2 if needed |
| Hash URL polluted by every scroll | Only update history on explicit click, not on scroll |

## Security Considerations
- No user input — all anchors derived from i18n keys (controlled)
- No `dangerouslySetInnerHTML`

## Next Steps
- Phase 5: write tests
