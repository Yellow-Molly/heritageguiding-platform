import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkRateLimit } from '../rate-limit-by-ip'

describe('checkRateLimit', () => {
  // Use unique IPs per test to avoid state leakage
  let testIp: string
  let counter = 0

  beforeEach(() => {
    counter++
    testIp = `192.168.1.${counter}`
  })

  it('allows first request from a new IP', () => {
    const result = checkRateLimit(testIp)
    expect(result.success).toBe(true)
  })

  it('allows requests within the limit', () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(testIp).success).toBe(true)
    }
  })

  it('blocks requests exceeding the limit', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit(testIp)
    }
    expect(checkRateLimit(testIp).success).toBe(false)
  })

  it('tracks different IPs independently', () => {
    const ip1 = `10.0.0.${counter + 100}`
    const ip2 = `10.0.0.${counter + 200}`

    // Exhaust ip1 limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit(ip1)
    }
    expect(checkRateLimit(ip1).success).toBe(false)

    // ip2 should still be allowed
    expect(checkRateLimit(ip2).success).toBe(true)
  })

  it('respects custom maxRequests option', () => {
    const options = { maxRequests: 2, windowMs: 60_000 }

    expect(checkRateLimit(testIp, options).success).toBe(true)
    expect(checkRateLimit(testIp, options).success).toBe(true)
    expect(checkRateLimit(testIp, options).success).toBe(false)
  })

  it('resets after window expires', async () => {
    const options = { maxRequests: 1, windowMs: 50 } // 50ms window

    expect(checkRateLimit(testIp, options).success).toBe(true)
    expect(checkRateLimit(testIp, options).success).toBe(false)

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 60))

    expect(checkRateLimit(testIp, options).success).toBe(true)
  })

  it('triggers cleanup of expired entries after 60s interval', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    const ip = '10.99.99.1'
    const options = { maxRequests: 1, windowMs: 100 }

    // Create an entry with a very short window
    checkRateLimit(ip, options)

    // Advance time past both the entry window AND the 60s cleanup interval
    vi.setSystemTime(now + 61_000)

    // This call triggers cleanupExpired which removes the expired entry for ip
    const freshIp = '10.99.99.2'
    checkRateLimit(freshIp)

    // The original ip entry was expired and cleaned up; a new request should start a fresh window
    const result = checkRateLimit(ip, options)
    expect(result.success).toBe(true)

    vi.useRealTimers()
  })

  it('cleanup does not delete non-expired entries', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    const ip = '10.99.99.3'
    const options = { maxRequests: 2, windowMs: 120_000 } // 2 min window

    checkRateLimit(ip, options) // count=1

    // Advance past the 60s cleanup interval but NOT past the 2 min window
    vi.setSystemTime(now + 61_000)

    const triggerIp = '10.99.99.4'
    checkRateLimit(triggerIp) // triggers cleanupExpired

    // ip's entry should still exist (window hasn't expired yet)
    checkRateLimit(ip, options) // count=2, still within maxRequests
    expect(checkRateLimit(ip, options).success).toBe(false) // count=3 > maxRequests=2

    vi.useRealTimers()
  })
})
