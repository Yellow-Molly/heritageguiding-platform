/**
 * Tests for BokunApiClient with HMAC authentication
 * Covers: BokunError, constructor credential validation, fetch (auth headers, retry, error handling),
 *         convenience methods, lazy factory (getBokunClient)
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
  getBokunClient,
  __resetBokunClientForTests,
} from '../bokun-api-client-with-hmac-authentication'

// Helper to create a mock Response-like object.
// Both `json()` and `text()` are provided because successful responses parse via
// json() while non-2xx responses now read raw body via text() first (so we can
// surface ANY shape Bokun returns, not just the documented `{message}` envelope).
function mockResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) {
  const bodyText = typeof body === 'string' ? body : JSON.stringify(body)
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 429 ? 'Too Many Requests' : 'Error',
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(bodyText),
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
  // constructor — credential validation (fails fast on missing env)
  // --------------------------------------------------------------------------
  describe('constructor credential validation', () => {
    it('constructs successfully when both API keys are set', () => {
      expect(() => new BokunApiClient()).not.toThrow()
    })

    it('throws BokunError when both keys missing', () => {
      vi.stubEnv('BOKUN_API_KEY', '')
      vi.stubEnv('BOKUN_SECRET_KEY', '')
      expect(() => new BokunApiClient()).toThrow(BokunError)
    })

    it('throws when only access key missing', () => {
      vi.stubEnv('BOKUN_API_KEY', '')
      expect(() => new BokunApiClient()).toThrow(BokunError)
    })

    it('throws when only secret key missing', () => {
      vi.stubEnv('BOKUN_SECRET_KEY', '')
      expect(() => new BokunApiClient()).toThrow(BokunError)
    })

    it('thrown error carries CREDENTIALS_MISSING code', () => {
      vi.stubEnv('BOKUN_API_KEY', '')
      vi.stubEnv('BOKUN_SECRET_KEY', '')
      try {
        new BokunApiClient()
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(BokunError)
        expect((err as BokunError).errorCode).toBe('CREDENTIALS_MISSING')
      }
    })

    it('thrown error mentions both env var names', () => {
      vi.stubEnv('BOKUN_API_KEY', '')
      vi.stubEnv('BOKUN_SECRET_KEY', '')
      try {
        new BokunApiClient()
        throw new Error('should have thrown')
      } catch (err) {
        const message = (err as BokunError).message
        expect(message).toContain('BOKUN_API_KEY')
        expect(message).toContain('BOKUN_SECRET_KEY')
      }
    })

    it('fails fast at construction, not at first fetch call', () => {
      vi.stubEnv('BOKUN_API_KEY', '')
      vi.stubEnv('BOKUN_SECRET_KEY', '')
      // Mere construction must throw — no need to call fetch()
      expect(() => new BokunApiClient()).toThrow()
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

    it('sets X-Bokun-Date header in Bokun UTC format "yyyy-MM-dd HH:mm:ss"', async () => {
      // Regression guard: Bokun's HMAC scheme rejects ISO-8601 (`...T...Z`) with 403
      // because the signature input is concatenated verbatim. Format must be
      // space-separated, no milliseconds, no timezone suffix.
      mockFetch.mockResolvedValueOnce(mockResponse({ data: 'ok' }))
      await client.fetch('/test')
      const headers = mockFetch.mock.calls[0][1].headers
      expect(headers['X-Bokun-Date']).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
      expect(headers['X-Bokun-Date']).not.toContain('T')
      expect(headers['X-Bokun-Date']).not.toContain('Z')
      expect(headers['X-Bokun-Date']).not.toContain('.')
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

    it('returns {} on 204 No Content without invoking json()', async () => {
      // PUT /experience/{id}/components routinely answers 204; calling
      // response.json() on the empty body throws "Unexpected end of JSON input".
      const resp = {
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Headers(),
        json: vi.fn().mockRejectedValue(new Error('should not be called')),
        text: vi.fn().mockResolvedValue(''),
      }
      mockFetch.mockResolvedValueOnce(resp)
      const data = await client.fetch('/test')
      expect(data).toEqual({})
      expect(resp.json).not.toHaveBeenCalled()
    })

    it('returns {} on 2xx with empty body', async () => {
      const resp = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        json: vi.fn().mockRejectedValue(new Error('should not be called')),
        text: vi.fn().mockResolvedValue(''),
      }
      mockFetch.mockResolvedValueOnce(resp)
      const data = await client.fetch('/test')
      expect(data).toEqual({})
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
        text: vi.fn().mockResolvedValue(''),
      }
      mockFetch.mockResolvedValueOnce(resp)
      await expect(client.fetch('/test')).rejects.toThrow('Bad Gateway')
    })

    it('surfaces non-JSON error body text in BokunError message', async () => {
      // Bokun sometimes returns plain text or HTML on 4xx — must not be silently dropped.
      mockFetch.mockResolvedValueOnce(mockResponse('title is required', 400))
      try {
        await client.fetch('/test')
        throw new Error('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(BokunError)
        expect((err as BokunError).message).toContain('title is required')
        expect((err as BokunError).status).toBe(400)
      }
    })

    it('surfaces { error } shape from Bokun 400 responses', async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse({ error: 'Invalid pricing category' }, 400)
      )
      try {
        await client.fetch('/test')
        throw new Error('should have thrown')
      } catch (err) {
        expect((err as BokunError).message).toContain('Invalid pricing category')
      }
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
// Lazy factory: getBokunClient
// ============================================================================
describe('getBokunClient (lazy singleton)', () => {
  beforeEach(() => {
    __resetBokunClientForTests()
    vi.stubEnv('BOKUN_API_KEY', 'test-access-key')
    vi.stubEnv('BOKUN_SECRET_KEY', 'test-secret-key')
  })

  it('returns a BokunApiClient instance', () => {
    expect(getBokunClient()).toBeInstanceOf(BokunApiClient)
  })

  it('returns the same instance across repeated calls', () => {
    const first = getBokunClient()
    const second = getBokunClient()
    expect(first).toBe(second)
  })

  it('reset helper clears the cached instance', () => {
    const first = getBokunClient()
    __resetBokunClientForTests()
    const second = getBokunClient()
    expect(first).not.toBe(second)
  })

  it('propagates constructor errors when env vars missing', () => {
    __resetBokunClientForTests()
    vi.stubEnv('BOKUN_API_KEY', '')
    vi.stubEnv('BOKUN_SECRET_KEY', '')
    expect(() => getBokunClient()).toThrow(BokunError)
  })
})
