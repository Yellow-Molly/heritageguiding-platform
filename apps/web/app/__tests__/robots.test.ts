import { describe, it, expect } from 'vitest'
import robots from '../robots'

describe('robots.ts', () => {
  it('returns robots configuration object', () => {
    const result = robots()
    expect(result).toBeDefined()
  })

  it('allows all user agents on /', () => {
    const result = robots()
    const rules = result.rules as { userAgent: string; allow: string; disallow: string[] }
    expect(rules.userAgent).toBe('*')
    expect(rules.allow).toBe('/')
  })

  it('disallows /admin/ and /api/', () => {
    const result = robots()
    const rules = result.rules as { disallow: string[] }
    expect(rules.disallow).toContain('/admin/')
    expect(rules.disallow).toContain('/api/')
  })

  it('includes sitemap URL', () => {
    const result = robots()
    expect(result.sitemap).toContain('/sitemap.xml')
  })
})
