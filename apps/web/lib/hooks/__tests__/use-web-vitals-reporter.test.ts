import { describe, it, expect, vi, beforeEach } from 'vitest'

// Capture the callback passed to useReportWebVitals
let reportCallback: ((metric: unknown) => void) | null = null

vi.mock('next/web-vitals', () => ({
  useReportWebVitals: vi.fn((cb: (metric: unknown) => void) => {
    reportCallback = cb
  }),
}))

// Must import after mock setup
const { useWebVitalsReporter } = await import('../use-web-vitals-reporter')

describe('useWebVitalsReporter', () => {
  beforeEach(() => {
    reportCallback = null
    vi.clearAllMocks()
    vi.stubGlobal('navigator', { sendBeacon: vi.fn() })
  })

  it('registers a callback with useReportWebVitals', () => {
    useWebVitalsReporter()
    expect(reportCallback).toBeTypeOf('function')
  })

  it('logs valid metrics to console in development', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

    useWebVitalsReporter()
    reportCallback!({
      name: 'LCP',
      value: 1200.5,
      rating: 'good',
      id: 'v4-test',
      navigationType: 'navigate',
    })

    expect(consoleSpy).toHaveBeenCalledWith('[Web Vital] LCP: 1200.50')
    consoleSpy.mockRestore()
  })

  it('ignores unknown metric names', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

    useWebVitalsReporter()
    reportCallback!({
      name: 'UNKNOWN_METRIC',
      value: 100,
      rating: 'good',
      id: 'v4-test',
      navigationType: 'navigate',
    })

    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('reports all 6 valid metric types', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    useWebVitalsReporter()

    const validNames = ['LCP', 'FID', 'CLS', 'TTFB', 'INP', 'FCP']
    for (const name of validNames) {
      reportCallback!({ name, value: 100, rating: 'good', id: 'test', navigationType: 'navigate' })
    }

    expect(consoleSpy).toHaveBeenCalledTimes(6)
    consoleSpy.mockRestore()
  })

  it('uses sendBeacon in production mode', () => {
    // Temporarily set NODE_ENV to production
    const originalEnv = process.env.NODE_ENV
    vi.stubEnv('NODE_ENV', 'production')

    const beaconSpy = vi.fn()
    vi.stubGlobal('navigator', { sendBeacon: beaconSpy })

    useWebVitalsReporter()
    reportCallback!({
      name: 'CLS',
      value: 0.05,
      rating: 'good',
      id: 'v4-cls',
      navigationType: 'navigate',
    })

    expect(beaconSpy).toHaveBeenCalledWith(
      '/api/analytics/vitals',
      expect.stringContaining('"name":"CLS"')
    )

    vi.stubEnv('NODE_ENV', originalEnv!)
  })

  it('uses fetch fallback when sendBeacon is unavailable', async () => {
    const originalEnv = process.env.NODE_ENV
    vi.stubEnv('NODE_ENV', 'production')

    // Navigator without sendBeacon
    vi.stubGlobal('navigator', {})

    const fetchSpy = vi.fn().mockResolvedValue(new Response())
    vi.stubGlobal('fetch', fetchSpy)

    useWebVitalsReporter()
    reportCallback!({
      name: 'LCP',
      value: 1500,
      rating: 'needs-improvement',
      id: 'v4-fallback',
      navigationType: 'navigate',
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/analytics/vitals',
      expect.objectContaining({
        method: 'POST',
        keepalive: true,
      })
    )

    vi.stubEnv('NODE_ENV', originalEnv!)
  })
})
