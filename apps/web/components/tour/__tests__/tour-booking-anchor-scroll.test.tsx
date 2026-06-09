import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TourBookingAnchorScroll } from '../tour-booking-anchor-scroll'

/**
 * Guards the iOS-Safari deep-link fix: the component must take over #booking
 * navigation with a non-animated scroll, keep re-pinning through *spaced-out*
 * booking-card resizes (the Bokun widget settling well after the first scroll),
 * and bail the moment the user interacts.
 */

let scrollSpy: ReturnType<typeof vi.fn>
let resizeCallback: ResizeObserverCallback | null = null

class MockResizeObserver {
  private cb: ResizeObserverCallback
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb
    resizeCallback = cb
  }
  observe() {
    // Real ResizeObserver delivers one callback immediately on observe — model
    // it so tests exercise the same initial-delivery path the component sees.
    this.cb([], this as unknown as ResizeObserver)
  }
  unobserve() {}
  disconnect() {}
}

function triggerResize() {
  resizeCallback?.([], {} as ResizeObserver)
}

function renderWithBooking() {
  return render(
    <>
      <a href="#booking" data-testid="book-now">
        Book Now
      </a>
      <div id="booking">booking content</div>
      <TourBookingAnchorScroll />
    </>,
  )
}

beforeEach(() => {
  scrollSpy = vi.fn()
  resizeCallback = null
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: scrollSpy,
    writable: true,
    configurable: true,
  })
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  // Run rAF synchronously so the initial-hash path is observable in the test.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  // Reset the URL hash without dispatching hashchange into the next test.
  window.history.replaceState(null, '', '/')
})

describe('TourBookingAnchorScroll', () => {
  it('intercepts a Book Now tap: prevents the native jump and pins #booking', () => {
    renderWithBooking()
    scrollSpy.mockClear()

    const notPrevented = fireEvent.click(screen.getByTestId('book-now'))

    expect(notPrevented).toBe(false) // preventDefault() was called
    expect(scrollSpy).toHaveBeenCalled()
    expect(window.location.hash).toBe('#booking')
  })

  it('keeps re-pinning across multiple spaced resizes (no premature settle)', () => {
    renderWithBooking()
    fireEvent.click(screen.getByTestId('book-now'))
    scrollSpy.mockClear()

    // Widget reflows arrive separately (chunk render, then iframe sizing) — each
    // must still re-pin; an early "settled" stop would miss the later one.
    triggerResize()
    triggerResize()

    expect(scrollSpy).toHaveBeenCalledTimes(2)
  })

  it('pins #booking on direct load when the hash is already present', () => {
    window.history.replaceState(null, '', '/#booking')
    renderWithBooking()

    expect(scrollSpy).toHaveBeenCalled()
  })

  it('stops re-pinning once the user interacts (pointerdown)', () => {
    renderWithBooking()
    fireEvent.click(screen.getByTestId('book-now'))
    scrollSpy.mockClear()

    window.dispatchEvent(new Event('pointerdown'))
    triggerResize()

    expect(scrollSpy).not.toHaveBeenCalled()
  })
})
