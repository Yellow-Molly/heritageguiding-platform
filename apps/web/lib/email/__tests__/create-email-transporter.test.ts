import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock is hoisted to top of file, so mockCreateTransport must also be hoisted
// via vi.hoisted() to be accessible inside the factory function.
const mockCreateTransport = vi.hoisted(() => vi.fn(() => ({ sendMail: vi.fn() })))
vi.mock('nodemailer', () => ({ createTransport: mockCreateTransport }))

import { createEmailTransporter } from '../create-email-transporter'

describe('createEmailTransporter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('GMAIL_USER', 'test@gmail.com')
    vi.stubEnv('GMAIL_APP_PASSWORD', 'test-app-password')
  })

  it('returns a nodemailer transport object', () => {
    const transport = createEmailTransporter()
    expect(transport).toBeDefined()
    expect(transport).toHaveProperty('sendMail')
  })

  it('uses gmail service config', () => {
    createEmailTransporter()
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'gmail' })
    )
  })

  it('passes GMAIL_USER from env', () => {
    createEmailTransporter()
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ auth: expect.objectContaining({ user: 'test@gmail.com' }) })
    )
  })

  it('passes GMAIL_APP_PASSWORD from env', () => {
    createEmailTransporter()
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ auth: expect.objectContaining({ pass: 'test-app-password' }) })
    )
  })
})
