import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock createEmailTransporter before importing module under test
const mockSendMail = vi.fn()
vi.mock('../create-email-transporter', () => ({
  createEmailTransporter: vi.fn(() => ({ sendMail: mockSendMail })),
}))

import { sendInquiryConfirmationToCustomer } from '../send-inquiry-confirmation-to-customer'

describe('sendInquiryConfirmationToCustomer', () => {
  const baseData = { to: 'customer@example.com', name: 'Jane Smith', groupSize: 8 }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GMAIL_USER', 'noreply@tours.com')
  })

  it('calls sendMail on transporter', async () => {
    await sendInquiryConfirmationToCustomer(baseData)
    expect(mockSendMail).toHaveBeenCalledTimes(1)
  })

  it('sets from address using GMAIL_USER', async () => {
    await sendInquiryConfirmationToCustomer(baseData)
    const args = mockSendMail.mock.calls[0][0]
    expect(args.from).toContain('noreply@tours.com')
  })

  it('sets to address from data.to', async () => {
    await sendInquiryConfirmationToCustomer(baseData)
    const args = mockSendMail.mock.calls[0][0]
    expect(args.to).toBe('customer@example.com')
  })

  it('includes correct subject line', async () => {
    await sendInquiryConfirmationToCustomer(baseData)
    const args = mockSendMail.mock.calls[0][0]
    expect(args.subject).toBe('We received your group booking inquiry')
  })

  it('HTML body contains customer name', async () => {
    await sendInquiryConfirmationToCustomer(baseData)
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).toContain('Jane Smith')
  })

  it('HTML body contains group size', async () => {
    await sendInquiryConfirmationToCustomer(baseData)
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).toContain('8')
  })

  it('escapes HTML entities in name', async () => {
    await sendInquiryConfirmationToCustomer({ ...baseData, name: '<b>Bold</b>' })
    const html = mockSendMail.mock.calls[0][0].html
    expect(html).not.toContain('<b>Bold</b>')
    expect(html).toContain('&lt;b&gt;')
  })
})
