import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock email services to avoid real SMTP calls
vi.mock('@/lib/email/send-inquiry-notification-to-admin', () => ({
  sendInquiryNotificationToAdmin: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/email/send-inquiry-confirmation-to-customer', () => ({
  sendInquiryConfirmationToCustomer: vi.fn().mockResolvedValue(undefined),
}))

// Mock rate limiter to always allow (tested separately)
vi.mock('@/lib/rate-limit-by-ip', () => ({
  checkRateLimit: vi.fn().mockReturnValue({ success: true }),
}))

const { POST } = await import('../route')
const { sendInquiryNotificationToAdmin } = await import(
  '@/lib/email/send-inquiry-notification-to-admin'
)
const { sendInquiryConfirmationToCustomer } = await import(
  '@/lib/email/send-inquiry-confirmation-to-customer'
)
const { checkRateLimit } = await import('@/lib/rate-limit-by-ip')

const validPayload = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '46701234567',
  groupSize: 25,
  preferredDates: 'June 15-20, 2026',
  tourInterest: 'Historical Stockholm',
  specialRequirements: 'Wheelchair access needed',
  honeypot: '',
}

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/group-inquiry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/group-inquiry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validation', () => {
    it('accepts valid inquiry payload', async () => {
      const response = await POST(createRequest(validPayload))
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('rejects missing firstName', async () => {
      const response = await POST(createRequest({ ...validPayload, firstName: '' }))
      expect(response.status).toBe(400)
    })

    it('rejects missing lastName', async () => {
      const response = await POST(createRequest({ ...validPayload, lastName: 'A' }))
      expect(response.status).toBe(400)
    })

    it('rejects invalid email', async () => {
      const response = await POST(createRequest({ ...validPayload, email: 'not-an-email' }))
      expect(response.status).toBe(400)
    })

    it('rejects short phone number', async () => {
      const response = await POST(createRequest({ ...validPayload, phone: '123' }))
      expect(response.status).toBe(400)
    })

    it('rejects group size below 20', async () => {
      const response = await POST(createRequest({ ...validPayload, groupSize: 10 }))
      expect(response.status).toBe(400)
    })

    it('rejects group size above 200', async () => {
      const response = await POST(createRequest({ ...validPayload, groupSize: 300 }))
      expect(response.status).toBe(400)
    })

    it('rejects short preferredDates', async () => {
      const response = await POST(createRequest({ ...validPayload, preferredDates: 'Jun' }))
      expect(response.status).toBe(400)
    })

    it('accepts optional fields as undefined', async () => {
      const { tourInterest, specialRequirements, ...minimal } = validPayload
      const response = await POST(createRequest(minimal))
      expect(response.status).toBe(200)
    })

    it('handles malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/group-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{bad json',
      })
      const response = await POST(request)
      expect([400, 500]).toContain(response.status)
    })
  })

  describe('spam protection', () => {
    it('returns fake success for honeypot-triggered submissions', async () => {
      const response = await POST(
        createRequest({ ...validPayload, honeypot: 'bot-filled-this' })
      )
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      // Should NOT send actual emails
      expect(sendInquiryNotificationToAdmin).not.toHaveBeenCalled()
      expect(sendInquiryConfirmationToCustomer).not.toHaveBeenCalled()
    })
  })

  describe('rate limiting', () => {
    it('returns 429 when rate limited', async () => {
      vi.mocked(checkRateLimit).mockReturnValueOnce({ success: false })
      const response = await POST(createRequest(validPayload))
      expect(response.status).toBe(429)
    })
  })

  describe('email sending', () => {
    it('sends admin notification and customer confirmation', async () => {
      await POST(createRequest(validPayload))

      expect(sendInquiryNotificationToAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          groupSize: 25,
        })
      )

      expect(sendInquiryConfirmationToCustomer).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          name: 'John',
          groupSize: 25,
        })
      )
    })

    it('returns 500 when email sending fails', async () => {
      vi.mocked(sendInquiryNotificationToAdmin).mockRejectedValueOnce(new Error('SMTP down'))
      const response = await POST(createRequest(validPayload))
      expect(response.status).toBe(500)
    })
  })
})
