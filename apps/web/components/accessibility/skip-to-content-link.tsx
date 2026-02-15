'use client'

/**
 * Skip to content link for keyboard navigation accessibility.
 * Visually hidden until focused, then appears at top of page.
 * WCAG 2.1 AA: 2.4.1 Bypass Blocks
 */
export function SkipToContentLink() {
  return (
    <a
      href="#main"
      className="fixed top-0 left-0 z-[9999] -translate-y-full bg-[var(--color-primary)] px-4 py-2 text-white transition-transform focus:translate-y-0"
    >
      Skip to content
    </a>
  )
}
