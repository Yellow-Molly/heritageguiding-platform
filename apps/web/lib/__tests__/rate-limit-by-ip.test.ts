import { describe, it, expect, beforeEach } from 'vitest'
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
})
