import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSendMail = vi.fn()
vi.mock('../create-email-transporter', () => ({
  createEmailTransporter: vi.fn(() => ({ sendMail: mockSendMail })),
}))

import { sendContactNotificationToAdmin } from '../send-contact-notification-to-admin'

describe('sendContactNotificationToAdmin', () => {
  const baseData = {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    subject: 'general',
    message: 'I would like to learn more about your tours.',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GMAIL_USER', 'admin@tours.com')
    vi.stubEnv('ADMIN_EMAIL', 'admin@company.com')
  })

  it('calls sendMail on transporter', async () => {
    await sendContactNotificationToAdmin(baseData)
    expect(mockSendMail).toHaveBeenCalledTimes(1)
  })

  it('sets from address using GMAIL_USER', async () => {
    await sendContactNotificationToAdmin(baseData)
    const args = mockSendMail.mock.calls[0][0]
    expect(args.from).toContain('admin@tours.com')
  })

  it('sets to address using ADMIN_EMAIL', async () => {
    await sendContactNotificationToAdmin(baseData)
    const args = mockSendMail.mock.calls[0][0]
    expect(args.to).toBe('admin@company.com')
  })

  it('includes name and subject label in email subject', async () => {
    await sendContactNotificationToAdmin(baseData)
    const args = mockSendMail.mock.calls[0][0]
    expect(args.subject).toContain('Jane Doe')
    expect(args.subject).toContain('General Inquiry')
  })

  it('HTML body contains all required fields', async () => {
    await sendContactNotificationToAdmin(baseData)
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).toContain('Jane Doe')
    expect(html).toContain('jane@example.com')
    expect(html).toContain('General Inquiry')
    expect(html).toContain('I would like to learn more')
  })

  it('includes phone when provided', async () => {
    await sendContactNotificationToAdmin({ ...baseData, phone: '+46701234567' })
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).toContain('+46701234567')
  })

  it('escapes HTML in name to prevent injection', async () => {
    await sendContactNotificationToAdmin({ ...baseData, fullName: '<script>alert("xss")</script>' })
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})
