import { describe, it, expect } from 'vitest'
import { isAdmin } from '../access/is-admin'
import { isAuthenticated } from '../access/is-authenticated'

// Mock request object helper
const createMockReq = (user: { role?: string } | null = null) => ({
  user,
})

describe('isAdmin', () => {
  it('returns true when user is admin', () => {
    const result = isAdmin({ req: createMockReq({ role: 'admin' }) } as any)
    expect(result).toBe(true)
  })

  it('returns false when user is editor', () => {
    const result = isAdmin({ req: createMockReq({ role: 'editor' }) } as any)
    expect(result).toBe(false)
  })

  it('returns false when user has no role', () => {
    const result = isAdmin({ req: createMockReq({}) } as any)
    expect(result).toBe(false)
  })

  it('returns false when user is null', () => {
    const result = isAdmin({ req: createMockReq(null) } as any)
    expect(result).toBe(false)
  })

  it('returns false when user is undefined', () => {
    const result = isAdmin({ req: { user: undefined } } as any)
    expect(result).toBe(false)
  })
})

describe('isAuthenticated', () => {
  it('returns true when user exists', () => {
    const result = isAuthenticated({ req: createMockReq({ role: 'editor' }) } as any)
    expect(result).toBe(true)
  })

  it('returns true when admin user exists', () => {
    const result = isAuthenticated({ req: createMockReq({ role: 'admin' }) } as any)
    expect(result).toBe(true)
  })

  it('returns false when user is null', () => {
    const result = isAuthenticated({ req: createMockReq(null) } as any)
    expect(result).toBe(false)
  })

  it('returns false when user is undefined', () => {
    const result = isAuthenticated({ req: { user: undefined } } as any)
    expect(result).toBe(false)
  })

  it('returns true when user object is empty but exists', () => {
    const result = isAuthenticated({ req: createMockReq({}) } as any)
    expect(result).toBe(true)
  })
})
