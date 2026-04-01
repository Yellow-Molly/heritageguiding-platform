import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Payload CMS
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    create: vi.fn().mockResolvedValue({ id: '1' }),
    update: vi.fn().mockResolvedValue({ id: '1' }),
  }),
}))

vi.mock('@cms/payload.config', () => ({ default: {} }))

// Mock email functions
vi.mock('@/lib/email/send-contact-notification-to-admin', () => ({
  sendContactNotificationToAdmin: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/email/send-contact-confirmation-to-customer', () => ({
  sendContactConfirmationToCustomer: vi.fn().mockResolvedValue(undefined),
}))

// Mock rate limiter
vi.mock('@/lib/rate-limit-by-ip', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true }),
}))

const { POST } = await import('../route')
const { checkRateLimit } = await import('@/lib/rate-limit-by-ip')

describe('POST /api/contact', () => {
  const validBody = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+46701234567',
    subject: 'general',
    message: 'I would like to learn more about your heritage tours in Stockholm.',
    honeypot: '',
  }

  function createRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(checkRateLimit).mockReturnValue({ success: true })
  })

  it('returns 200 on valid submission', async () => {
    const response = await POST(createRequest(validBody))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('returns 400 on missing required fields', async () => {
    const response = await POST(createRequest({ fullName: 'Jane' }))
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.errors).toBeDefined()
  })

  it('returns 400 on invalid email', async () => {
    const response = await POST(createRequest({ ...validBody, email: 'notanemail' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 on short message', async () => {
    const response = await POST(createRequest({ ...validBody, message: 'Hi' }))
    expect(response.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ success: false })
    const response = await POST(createRequest(validBody))
    expect(response.status).toBe(429)
  })

  it('returns fake 200 when honeypot is filled (bot)', async () => {
    const response = await POST(createRequest({ ...validBody, honeypot: 'spam' }))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })

  it('rejects invalid subject value', async () => {
    const response = await POST(createRequest({ ...validBody, subject: 'invalid_subject' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 on malformed JSON body', async () => {
    const request = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.message).toContain('Invalid JSON')
  })
})
