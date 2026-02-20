/**
 * Tests for BokunApiClient with HMAC authentication
 * Covers: BokunError, isConfigured, fetch (auth headers, retry, error handling), convenience methods, singleton
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch before module import
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Stub env vars before importing so constructor reads them
vi.stubEnv('BOKUN_API_KEY', 'test-access-key')
vi.stubEnv('BOKUN_SECRET_KEY', 'test-secret-key')

// Import after env setup
import {
  BokunError,
  BokunApiClient,
  bokunClient,
  getBokunClient,
} from '../bokun-api-client-with-hmac-authentication'

// Helper to create a mock Response-like object
function mockResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 429 ? 'Too Many Requests' : 'Error',
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(body),
  }
}

// ============================================================================
// BokunError
// ============================================================================
describe('BokunError', () => {
  it('creates error with message, status and errorCode', () => {
    const err = new BokunError('test error', 404, 'NOT_FOUND')
    expect(err.message).toBe('test error')
    expect(err.status).toBe(404)
    expect(err.errorCode).toBe('NOT_FOUND')
  })

  it('sets name to BokunError', () => {
    const err = new BokunError('test', 500)
    expect(err.name).toBe('BokunError')
  })

  it('works without optional errorCode', () => {
    const err = new BokunError('minimal', 400)
    expect(err.errorCode).toBeUndefined()
  })

  it('is an instance of Error', () => {
    const err = new BokunError('test', 500)
    expect(err).toBeInstanceOf(Error)
  })
})

// ============================================================================
// BokunApiClient
// ============================================================================
describe('BokunApiClient', () => {
  let client: BokunApiClient

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('BOKUN_API_KEY', 'test-access-key')
    vi.stubEnv('BOKUN_SECRET_KEY', 'test-secret-key')
    vi.stubEnv('NODE_ENV', 'test')
    client = new BokunApiClient()
  })

  // --------------------------------------------------------------------------
  // isConfigured
  // --------------------------------------------------------------------------
  describe('isConfigured', () => {
    it('returns true when both API keys are set', () => {
      expect(client.isConfigured()).toBe(true)
    })

    it('returns false when keys missing in non-production', () => {
      vi.stubEnv('BOKUN_API_KEY', '')
      vi.stubEnv('BOKUN_SECRET_KEY', '')
      const c = new BokunApiClient()
      expect(c.isConfigured()).toBe(false)
    })

    it('returns false when only access key missing', () => {
      vi.stubEnv('BOKUN_API_KEY', '')
      const c = new BokunApiClient()
      expect(c.isConfigured()).toBe(false)
    })

    it('throws BokunError in production when keys are missing', () => {
      vi.stubEnv('BOKUN_API_KEY', '')
      vi.stubEnv('BOKUN_SECRET_KEY', '')
      vi.stubEnv('NODE_ENV', 'production')
      const c = new BokunApiClient()
      expect(() => c.isConfigured()).toThrow(BokunError)
      vi.stubEnv('NODE_ENV', 'test')
    })

    it('throws with CREDENTIALS_MISSING error code in production', () => {
      vi.stubEnv('BOKUN_API_KEY', '')
      vi.stubEnv('BOKUN_SECRET_KEY', '')
      vi.stubEnv('NODE_ENV', 'production')
      const c = new BokunApiClient()
      try {
        c.isConfigured()
      } catch (err) {
        expect((err as BokunError).errorCode).toBe('CREDENTIALS_MISSING')
      }
      vi.stubEnv('NODE_ENV', 'test')
    })
  })

  // --------------------------------------------------------------------------
  // fetch - auth headers & URL
  // --------------------------------------------------------------------------
  describe('fetch - auth headers and URL', () => {
    it('sets X-Bokun-AccessKey header with api key', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ data: 'ok' }))
      await client.fetch('/test')
      const headers = mockFetch.mock.calls[0][1].headers
      expect(headers['X-Bokun-AccessKey']).toBe('test-access-key')
    })

    it('sets X-Bokun-Date header as ISO string', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ data: 'ok' }))
      await client.fetch('/test')
      const headers = mockFetch.mock.calls[0][1].headers
      expect(headers['X-Bokun-Date']).toBeDefined()
      expect(headers['X-Bokun-Date'].length).toBeGreaterThan(0)
    })

    it('sets X-Bokun-Signature header with non-empty HMAC value', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ data: 'ok' }))
      await client.fetch('/test')
      const headers = mockFetch.mock.calls[0][1].headers
      expect(headers['X-Bokun-Signature']).toBeDefined()
      expect(headers['X-Bokun-Signature'].length).toBeGreaterThan(0)
    })

    it('uses test URL (api.bokuntest.com) in non-production', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ data: 'ok' }))
      await client.fetch('/test')
      expect(mockFetch.mock.calls[0][0]).toContain('api.bokuntest.com')
    })

    it('returns parsed JSON response on success', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ result: 42 }))
      const data = await client.fetch<{ result: number }>('/test')
      expect(data).toEqual({ result: 42 })
    })
  })

  // --------------------------------------------------------------------------
  // fetch - error handling
  // --------------------------------------------------------------------------
  describe('fetch - error handling', () => {
    it('throws BokunError on 404 response', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ message: 'Not Found', errorCode: 'NOT_FOUND' }, 404)
      )
      await expect(client.fetch('/test')).rejects.toThrow(BokunError)
    })

    it('throws BokunError with correct status on 4xx', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ message: 'Auth failed', errorCode: 'AUTH_FAILED' }, 401)
      )
      try {
        await client.fetch('/test')
      } catch (err) {
        expect((err as BokunError).status).toBe(401)
        expect((err as BokunError).errorCode).toBe('AUTH_FAILED')
      }
    })

    it('throws BokunError on 500 response', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ message: 'Server Error', errorCode: 'INTERNAL' }, 500)
      )
      await expect(client.fetch('/test')).rejects.toThrow(BokunError)
    })

    it('handles unparseable error response body gracefully', async () => {
      const resp = {
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        headers: new Headers(),
        json: vi.fn().mockRejectedValue(new Error('parse error')),
      }
      mockFetch.mockResolvedValueOnce(resp)
      await expect(client.fetch('/test')).rejects.toThrow('Bad Gateway')
    })

    it('wraps network errors in BokunError with NETWORK_ERROR code', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'))
      try {
        await client.fetch('/test')
      } catch (err) {
        expect(err).toBeInstanceOf(BokunError)
        expect((err as BokunError).errorCode).toBe('NETWORK_ERROR')
      }
    })

    it('re-throws existing BokunError instances unchanged', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ message: 'Auth failed', errorCode: 'AUTH_FAILED' }, 401)
      )
      try {
        await client.fetch('/test')
      } catch (err) {
        expect(err).toBeInstanceOf(BokunError)
        expect((err as BokunError).status).toBe(401)
      }
    })
  })

  // --------------------------------------------------------------------------
  // fetch - rate limiting / retry
  // --------------------------------------------------------------------------
  describe('fetch - rate limiting with retry', () => {
    it('retries on 429 and succeeds on second attempt', async () => {
      vi.useFakeTimers()
      const rateLimitResp = mockResponse({}, 429, { 'Retry-After': '1' })
      const successResp = mockResponse({ data: 'ok' })

      mockFetch.mockResolvedValueOnce(rateLimitResp).mockResolvedValueOnce(successResp)

      const fetchPromise = client.fetch('/test')
      // Advance past the backoff delay (1s * 2^0 = 1000ms)
      await vi.advanceTimersByTimeAsync(2000)

      const result = await fetchPromise
      expect(result).toEqual({ data: 'ok' })
      expect(mockFetch).toHaveBeenCalledTimes(2)
      vi.useRealTimers()
    })

    it('throws RATE_LIMIT_EXCEEDED after MAX_RETRIES (3) persistent 429s', async () => {
      vi.useFakeTimers()
      const rateLimitResp = () => mockResponse({}, 429, { 'Retry-After': '1' })

      // Need 4 responses: initial + 3 retries all 429
      mockFetch
        .mockResolvedValueOnce(rateLimitResp())
        .mockResolvedValueOnce(rateLimitResp())
        .mockResolvedValueOnce(rateLimitResp())
        .mockResolvedValueOnce(rateLimitResp())

      const fetchPromise = client.fetch('/test')
      // Attach rejection handler immediately to prevent unhandled rejection
      const rejectPromise = expect(fetchPromise).rejects.toThrow('Rate limit exceeded after max retries')

      // Advance through all retry delays
      for (let i = 0; i < 15; i++) {
        await vi.advanceTimersByTimeAsync(35_000)
      }

      await rejectPromise
      vi.useRealTimers()
    })

    it('throws BokunError with RATE_LIMIT_EXCEEDED errorCode after max retries', async () => {
      vi.useFakeTimers()
      const rateLimitResp = () => mockResponse({}, 429, { 'Retry-After': '1' })

      mockFetch
        .mockResolvedValueOnce(rateLimitResp())
        .mockResolvedValueOnce(rateLimitResp())
        .mockResolvedValueOnce(rateLimitResp())
        .mockResolvedValueOnce(rateLimitResp())

      const fetchPromise = client.fetch('/test')
      // Attach rejection handler immediately to prevent unhandled rejection
      const rejectPromise = expect(fetchPromise).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof BokunError &&
          err.errorCode === 'RATE_LIMIT_EXCEEDED' &&
          err.status === 429
      )

      for (let i = 0; i < 15; i++) {
        await vi.advanceTimersByTimeAsync(35_000)
      }

      await rejectPromise
      vi.useRealTimers()
    })
  })

  // --------------------------------------------------------------------------
  // convenience methods
  // --------------------------------------------------------------------------
  describe('convenience methods', () => {
    it('get() calls fetch with GET method', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ data: 'ok' }))
      await client.get('/test-get')
      expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    })

    it('post() calls fetch with POST method and stringified body', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ data: 'ok' }))
      await client.post('/test-post', { key: 'value' })
      const call = mockFetch.mock.calls[0]
      expect(call[1].method).toBe('POST')
      expect(call[1].body).toBe(JSON.stringify({ key: 'value' }))
    })

    it('put() calls fetch with PUT method and stringified body', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ data: 'ok' }))
      await client.put('/test-put', { key: 'value' })
      const call = mockFetch.mock.calls[0]
      expect(call[1].method).toBe('PUT')
      expect(call[1].body).toBe(JSON.stringify({ key: 'value' }))
    })

    it('delete() calls fetch with DELETE method', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ data: 'ok' }))
      await client.delete('/test-delete')
      expect(mockFetch.mock.calls[0][1].method).toBe('DELETE')
    })
  })
})

// ============================================================================
// Singleton exports
// ============================================================================
describe('bokunClient / getBokunClient', () => {
  it('exports bokunClient as a BokunApiClient instance', () => {
    expect(bokunClient).toBeInstanceOf(BokunApiClient)
  })

  it('getBokunClient returns the same singleton instance', () => {
    expect(getBokunClient()).toBe(bokunClient)
  })
})
