'use client'

import { useEffect } from 'react'

/**
 * Deterministic scroll-to-#booking for the tour detail page.
 *
 * Problem it fixes (iOS Safari only): tapping the mobile "Book Now" anchor — or
 * loading the page with `#booking` in the URL — triggers a scroll toward the
 * booking section. As that section enters the viewport the Bokun widget
 * lazy-loads and injects an iframe; iFrameSizer then resizes it asynchronously,
 * mutating document height. WebKit responds to an anchor scroll racing that
 * reflow by collapsing to the top of the page (Blink holds position via scroll
 * anchoring, which WebKit doesn't implement) — so the user is bounced back to the
 * top. Once the widget has loaded there's no reflow, so it only misbehaves on the
 * first interaction.
 *
 * Fix: take over the navigation. Scroll to #booking without animation, then
 * re-pin it on every booking-card resize until the user interacts or a safety cap
 * elapses. Re-pinning *through* the async reflow — not just once up front — is
 * what undoes WebKit's bounce, because the reflow that triggers it lands a second
 * or more after the initial scroll (Bokun script fetch + iframe injection). A
 * short "settled" debounce is deliberately NOT used: the reflows are spaced out
 * (chunk render, then iframe sizing), so any early stop lands in the gap and
 * misses the bounce.
 *
 * Progressive enhancement over the plain anchor — no changes to the widget or to
 * the global smooth-scroll behavior other native anchors rely on.
 */

const BOOKING_ID = 'booking'
const TARGET_HASH = '#booking'

// Upper bound on the re-pin window. Must outlast a slow Bokun iframe injection
// (the reflow that bounces Safari) yet stay short enough that a late, unrelated
// resize can't yank a settled reader. Any user interaction ends it earlier.
const SETTLE_MAX_MS = 6000

// Keys that move the viewport — pressing one means the user took over scrolling.
const PAGE_MOVE_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'PageUp',
  'PageDown',
  'Home',
  'End',
  ' ',
  'Spacebar',
])

export function TourBookingAnchorScroll() {
  useEffect(() => {
    const target = document.getElementById(BOOKING_ID)
    if (!target) return

    const root = document.documentElement
    let savedScrollBehavior: string | null = null
    let maxTimer: number | undefined
    let observer: ResizeObserver | undefined
    let pendingRaf = 0
    let pinning = false

    // scroll-margin-top on #booking is honored, landing it below the header.
    const pinNow = () => target.scrollIntoView({ block: 'start' })

    const stopPinning = () => {
      if (!pinning) return
      pinning = false
      if (maxTimer) window.clearTimeout(maxTimer)
      observer?.disconnect()
      observer = undefined
      window.removeEventListener('pointerdown', stopPinning)
      window.removeEventListener('wheel', stopPinning)
      window.removeEventListener('keydown', onUserKey)
      // Restore the stylesheet's smooth-scroll for the rest of the page.
      if (savedScrollBehavior !== null) {
        root.style.scrollBehavior = savedScrollBehavior
        savedScrollBehavior = null
      }
    }

    function onUserKey(e: KeyboardEvent) {
      if (PAGE_MOVE_KEYS.has(e.key)) stopPinning()
    }

    const startPinning = () => {
      // Repeat trigger while already pinning — just re-assert the position.
      if (pinning) {
        pinNow()
        return
      }
      pinning = true

      // Force instant scrolling for the whole pin window; an inline style on
      // <html> beats `html { scroll-behavior: smooth }` via specificity, so the
      // initial scroll and every re-pin land instantly instead of animating.
      savedScrollBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'

      pinNow()

      // End the moment the user takes over. pointerdown covers a tap or mouse
      // press (so we never yank a calendar the user is interacting with), wheel
      // covers trackpads, keydown covers page-movement keys. Our own programmatic
      // scroll fires none of these, so re-pinning can't self-cancel.
      window.addEventListener('pointerdown', stopPinning, { passive: true })
      window.addEventListener('wheel', stopPinning, { passive: true })
      window.addEventListener('keydown', onUserKey)

      // Re-pin on each booking-card resize (Bokun injecting / sizing the iframe),
      // holding the position through the async reflow that bounces Safari.
      observer = new ResizeObserver(() => {
        if (pinning) pinNow()
      })
      observer.observe(target)

      maxTimer = window.setTimeout(stopPinning, SETTLE_MAX_MS)
    }

    // Entry 1: in-page tap on any link to #booking (the mobile "Book Now" CTA).
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) {
        return
      }
      const link = (e.target as HTMLElement | null)?.closest?.(`a[href="${TARGET_HASH}"]`)
      if (!link) return
      e.preventDefault()
      // Keep the URL shareable / back-navigable, but don't let the browser run
      // its own scroll — pushState doesn't scroll.
      if (window.location.hash !== TARGET_HASH) {
        window.history.pushState(null, '', TARGET_HASH)
      }
      startPinning()
    }

    // Entry 2: direct load / refresh / external link with #booking in the URL.
    // rAF lets the lazily-rendered BookingSection commit before we measure.
    const onHashTargeted = () => {
      if (window.location.hash === TARGET_HASH) {
        pendingRaf = window.requestAnimationFrame(startPinning)
      }
    }

    document.addEventListener('click', onClick)
    window.addEventListener('hashchange', onHashTargeted)
    onHashTargeted()

    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('hashchange', onHashTargeted)
      if (pendingRaf) window.cancelAnimationFrame(pendingRaf)
      stopPinning()
    }
  }, [])

  return null
}
