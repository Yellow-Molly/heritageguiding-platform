import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSendMail = vi.fn()
vi.mock('../create-email-transporter', () => ({
  createEmailTransporter: vi.fn(() => ({ sendMail: mockSendMail })),
}))

import { sendContactConfirmationToCustomer } from '../send-contact-confirmation-to-customer'

describe('sendContactConfirmationToCustomer', () => {
  const baseData = {
    to: 'jane@example.com',
    name: 'Jane Doe',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GMAIL_USER', 'admin@tours.com')
  })

  it('calls sendMail on transporter', async () => {
    await sendContactConfirmationToCustomer(baseData)
    expect(mockSendMail).toHaveBeenCalledTimes(1)
  })

  it('sends to the customer email', async () => {
    await sendContactConfirmationToCustomer(baseData)
    const args = mockSendMail.mock.calls[0][0]
    expect(args.to).toBe('jane@example.com')
  })

  it('includes customer name in HTML body', async () => {
    await sendContactConfirmationToCustomer(baseData)
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).toContain('Jane Doe')
  })

  it('mentions 24-hour response time', async () => {
    await sendContactConfirmationToCustomer(baseData)
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).toContain('24 hours')
  })

  it('escapes HTML in name to prevent injection', async () => {
    await sendContactConfirmationToCustomer({ ...baseData, name: '<img onerror=alert(1)>' })
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })
})
