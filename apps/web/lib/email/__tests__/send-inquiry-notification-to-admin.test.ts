import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock createEmailTransporter before importing module under test
const mockSendMail = vi.fn()
vi.mock('../create-email-transporter', () => ({
  createEmailTransporter: vi.fn(() => ({ sendMail: mockSendMail })),
}))

import { sendInquiryNotificationToAdmin } from '../send-inquiry-notification-to-admin'

describe('sendInquiryNotificationToAdmin', () => {
  const baseData = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+46701234567',
    groupSize: 10,
    preferredDates: 'June 2025',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GMAIL_USER', 'admin@tours.com')
    vi.stubEnv('ADMIN_EMAIL', 'admin@company.com')
  })

  it('calls sendMail on transporter', async () => {
    await sendInquiryNotificationToAdmin(baseData)
    expect(mockSendMail).toHaveBeenCalledTimes(1)
  })

  it('sets from address using GMAIL_USER', async () => {
    await sendInquiryNotificationToAdmin(baseData)
    const args = mockSendMail.mock.calls[0][0]
    expect(args.from).toContain('admin@tours.com')
  })

  it('sets to address using ADMIN_EMAIL', async () => {
    await sendInquiryNotificationToAdmin(baseData)
    const args = mockSendMail.mock.calls[0][0]
    expect(args.to).toBe('admin@company.com')
  })

  it('includes group size in subject', async () => {
    await sendInquiryNotificationToAdmin(baseData)
    const args = mockSendMail.mock.calls[0][0]
    expect(args.subject).toContain('10 people')
  })

  it('includes customer name in subject', async () => {
    await sendInquiryNotificationToAdmin(baseData)
    const args = mockSendMail.mock.calls[0][0]
    expect(args.subject).toContain('John Doe')
  })

  it('HTML body contains all required fields', async () => {
    await sendInquiryNotificationToAdmin(baseData)
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).toContain('John Doe')
    expect(html).toContain('john@example.com')
    expect(html).toContain('+46701234567')
    expect(html).toContain('10 people')
    expect(html).toContain('June 2025')
  })

  it('includes optional tourInterest when provided', async () => {
    await sendInquiryNotificationToAdmin({ ...baseData, tourInterest: 'Viking History' })
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).toContain('Viking History')
  })

  it('includes optional specialRequirements when provided', async () => {
    await sendInquiryNotificationToAdmin({ ...baseData, specialRequirements: 'Wheelchair access' })
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).toContain('Wheelchair access')
  })

  it('escapes HTML in name to prevent injection', async () => {
    await sendInquiryNotificationToAdmin({ ...baseData, name: '<script>alert("xss")</script>' })
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
