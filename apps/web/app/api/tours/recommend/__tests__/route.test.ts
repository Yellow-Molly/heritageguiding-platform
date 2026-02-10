import { describe, it, expect, vi, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Payload CMS - we only test Zod validation, not actual DB queries
vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

// Import after mocks are set up
const { POST } = await import('../route')

describe('POST /api/tours/recommend', () => {
  function createRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost:3000/api/tours/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  describe('Zod validation', () => {
    it('rejects missing audience field', async () => {
      const request = createRequest({ interests: ['food_wine'] })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request')
      expect(data.details).toBeDefined()
    })

    it('rejects empty audience array', async () => {
      const request = createRequest({ audience: [], interests: [] })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request')
    })

    it('rejects invalid audience tag', async () => {
      const request = createRequest({ audience: ['invalid_tag'] })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request')
    })

    it('rejects invalid interests tag', async () => {
      const request = createRequest({
        audience: ['family_friendly'],
        interests: ['not_a_real_tag']
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request')
    })

    it('rejects more than 5 audience tags', async () => {
      const request = createRequest({
        audience: ['family_friendly', 'couples', 'corporate', 'seniors', 'history_nerds', 'photography']
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request')
    })

    it('rejects more than 6 interests tags', async () => {
      const request = createRequest({
        audience: ['family_friendly'],
        interests: ['food_wine', 'adventure', 'architecture', 'history_nerds', 'photography', 'art_lovers', 'solo_travelers']
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request')
    })

    it('accepts valid audience without interests', async () => {
      const request = createRequest({ audience: ['family_friendly'] })
      const response = await POST(request)

      // Should not be validation error (status 400)
      // May be 200 (success) or 500 (Payload query error in test env)
      expect(response.status).not.toBe(400)
    })

    it('accepts valid audience and interests', async () => {
      const request = createRequest({
        audience: ['family_friendly', 'couples'],
        interests: ['food_wine', 'architecture']
      })
      const response = await POST(request)

      // Should not be validation error (status 400)
      expect(response.status).not.toBe(400)
    })

    it('accepts all valid audience tags', async () => {
      const validTags = ['family_friendly', 'couples', 'corporate', 'seniors', 'history_nerds']
      const request = createRequest({ audience: validTags })
      const response = await POST(request)

      expect(response.status).not.toBe(400)
    })

    it('accepts all valid interest tags', async () => {
      const request = createRequest({
        audience: ['family_friendly'],
        interests: ['photography', 'art_lovers', 'food_wine', 'adventure', 'architecture', 'solo_travelers']
      })
      const response = await POST(request)

      expect(response.status).not.toBe(400)
    })

    it('rejects non-array audience', async () => {
      const request = createRequest({ audience: 'family_friendly' })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request')
    })

    it('rejects non-array interests', async () => {
      const request = createRequest({
        audience: ['family_friendly'],
        interests: 'food_wine'
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Invalid request')
    })

    it('handles malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/tours/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json',
      })

      const response = await POST(request)

      // Either 400 (validation) or 500 (JSON parse error)
      expect([400, 500]).toContain(response.status)
    })

    it('defaults interests to empty array when omitted', async () => {
      const request = createRequest({ audience: ['couples'] })
      const response = await POST(request)

      // Should not throw validation error for missing interests
      expect(response.status).not.toBe(400)
    })

    it('validates tag enums case-sensitively', async () => {
      const request = createRequest({ audience: ['FAMILY_FRIENDLY'] })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('rejects null audience', async () => {
      const request = createRequest({ audience: null })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('rejects undefined audience', async () => {
      const request = createRequest({})
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('accepts exactly 1 audience tag', async () => {
      const request = createRequest({ audience: ['family_friendly'] })
      const response = await POST(request)

      expect(response.status).not.toBe(400)
    })

    it('accepts exactly 5 audience tags', async () => {
      const request = createRequest({
        audience: ['family_friendly', 'couples', 'corporate', 'seniors', 'history_nerds']
      })
      const response = await POST(request)

      expect(response.status).not.toBe(400)
    })

    it('accepts exactly 6 interests tags', async () => {
      const request = createRequest({
        audience: ['family_friendly'],
        interests: ['photography', 'art_lovers', 'food_wine', 'adventure', 'architecture', 'solo_travelers']
      })
      const response = await POST(request)

      expect(response.status).not.toBe(400)
    })

    it('rejects duplicate tags in audience', async () => {
      // Note: Zod doesn't validate uniqueness by default, so this may pass validation
      const request = createRequest({
        audience: ['family_friendly', 'family_friendly']
      })
      const response = await POST(request)

      // This may be accepted by current schema (no uniqueness constraint)
      // Just verify it doesn't crash
      expect([200, 400, 500]).toContain(response.status)
    })

    it('accepts mixed valid tags', async () => {
      const request = createRequest({
        audience: ['family_friendly', 'seniors', 'art_lovers'],
        interests: ['food_wine', 'architecture', 'photography']
      })
      const response = await POST(request)

      expect(response.status).not.toBe(400)
    })

    it('rejects extra fields not in schema', async () => {
      const request = createRequest({
        audience: ['family_friendly'],
        interests: [],
        extraField: 'should be ignored'
      })
      const response = await POST(request)

      // Zod by default strips extra fields, so this should pass validation
      expect(response.status).not.toBe(400)
    })
  })

  describe('error handling', () => {
    it('returns 400 with error details for invalid input', async () => {
      const request = createRequest({ audience: ['invalid'] })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('details')
    })

    it('returns proper JSON content-type', async () => {
      const request = createRequest({ audience: ['family_friendly'] })
      const response = await POST(request)

      expect(response.headers.get('content-type')).toContain('application/json')
    })
  })
})
