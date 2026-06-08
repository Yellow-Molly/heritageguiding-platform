import { describe, it, expect, afterEach, vi } from 'vitest'
import { getAdminEmail } from '../get-admin-email'

describe('getAdminEmail', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns ADMIN_EMAIL when set', () => {
    vi.stubEnv('ADMIN_EMAIL', 'info@privatetours.se')
    expect(getAdminEmail()).toBe('info@privatetours.se')
  })

  it('throws a clear error when ADMIN_EMAIL is unset', () => {
    vi.stubEnv('ADMIN_EMAIL', '')
    expect(() => getAdminEmail()).toThrow(/ADMIN_EMAIL/)
  })
})
