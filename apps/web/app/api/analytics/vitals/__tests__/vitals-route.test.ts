import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock rate limiter
vi.mock('@/lib/rate-limit-by-ip', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true }),
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue('127.0.0.1'),
  }),
}))

const { POST } = await import('../route')
const { checkRateLimit } = await import('@/lib/rate-limit-by-ip')

function createRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/analytics/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validPayload = {
  name: 'LCP',
  value: 1234.56,
  rating: 'good',
  id: 'v4-1234',
  navigationType: 'navigate',
}

describe('POST /api/analytics/vitals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('accepts valid LCP metric', async () => {
    const res = await POST(createRequest(validPayload))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  it('accepts valid CLS metric', async () => {
    const res = await POST(createRequest({ ...validPayload, name: 'CLS', value: 0.05 }))
    expect(res.status).toBe(200)
  })

  it('accepts valid FID metric', async () => {
    const res = await POST(createRequest({ ...validPayload, name: 'FID', value: 50 }))
    expect(res.status).toBe(200)
  })

  it('accepts valid TTFB metric', async () => {
    const res = await POST(createRequest({ ...validPayload, name: 'TTFB', value: 300 }))
    expect(res.status).toBe(200)
  })

  it('accepts valid INP metric', async () => {
    const res = await POST(createRequest({ ...validPayload, name: 'INP', value: 150 }))
    expect(res.status).toBe(200)
  })

  it('accepts valid FCP metric', async () => {
    const res = await POST(createRequest({ ...validPayload, name: 'FCP', value: 800 }))
    expect(res.status).toBe(200)
  })

  it('rejects invalid metric name', async () => {
    const res = await POST(createRequest({ ...validPayload, name: 'INVALID' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid metric name')
  })

  it('rejects missing metric name', async () => {
    const { name: _, ...noName } = validPayload
    const res = await POST(createRequest(noName))
    expect(res.status).toBe(400)
  })

  it('rejects non-numeric value', async () => {
    const res = await POST(createRequest({ ...validPayload, value: 'not-a-number' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid metric value')
  })

  it('rejects Infinity value', async () => {
    const res = await POST(createRequest({ ...validPayload, value: Infinity }))
    expect(res.status).toBe(400)
  })

  it('rejects invalid rating', async () => {
    const res = await POST(createRequest({ ...validPayload, rating: 'excellent' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid rating')
  })

  it('accepts needs-improvement rating', async () => {
    const res = await POST(createRequest({ ...validPayload, rating: 'needs-improvement' }))
    expect(res.status).toBe(200)
  })

  it('accepts poor rating', async () => {
    const res = await POST(createRequest({ ...validPayload, rating: 'poor' }))
    expect(res.status).toBe(200)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce({ success: false })
    const res = await POST(createRequest(validPayload))
    expect(res.status).toBe(429)
    const data = await res.json()
    expect(data.error).toBe('Too many requests')
  })

  it('returns 400 for malformed JSON', async () => {
    const req = new Request('http://localhost:3000/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('calls rate limiter with vitals prefix', async () => {
    await POST(createRequest(validPayload))
    expect(checkRateLimit).toHaveBeenCalledWith('vitals:127.0.0.1', {
      maxRequests: 30,
      windowMs: 60_000,
    })
  })
})
