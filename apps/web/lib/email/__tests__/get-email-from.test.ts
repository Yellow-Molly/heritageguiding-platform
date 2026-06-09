import { describe, it, expect, afterEach, vi } from 'vitest'
import { getEmailFrom } from '../get-email-from'

describe('getEmailFrom', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses EMAIL_FROM as the visible sender when set (Workspace alias)', () => {
    vi.stubEnv('GMAIL_USER', 'primary@privatetours.se')
    vi.stubEnv('EMAIL_FROM', 'bookings@privatetours.se')
    expect(getEmailFrom()).toBe('Private Tours <bookings@privatetours.se>')
  })

  it('falls back to GMAIL_USER when EMAIL_FROM is unset', () => {
    vi.stubEnv('GMAIL_USER', 'primary@privatetours.se')
    vi.stubEnv('EMAIL_FROM', '')
    expect(getEmailFrom()).toBe('Private Tours <primary@privatetours.se>')
  })
})
