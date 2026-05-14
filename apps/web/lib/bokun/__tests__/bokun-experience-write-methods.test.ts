/**
 * Tests for BokunApiClient Experience write methods (createExperience, updateExperience).
 * Verifies endpoint paths, HTTP methods, payload pass-through, ID encoding, error propagation,
 * and 429 retry behavior reuse from the underlying fetch() implementation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock global fetch before module import (mirrors pattern in sibling test file)
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.stubEnv('BOKUN_API_KEY', 'test-access-key')
vi.stubEnv('BOKUN_SECRET_KEY', 'test-secret-key')

import {
  BokunApiClient,
  BokunError,
} from '../bokun-api-client-with-hmac-authentication'
import type {
  BokunExperienceCreatePayload,
  BokunExperienceUpdatePayload,
} from '../bokun-types'

// Reusable mock Response factory
function mockResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(body),
  }
}

// Minimal valid create payload for tests; mapper produces richer ones in Phase 03.
function buildPayload(): BokunExperienceCreatePayload {
  return {
    title: [{ locale: 'en', value: 'Test Tour' }],
    description: [{ locale: 'en', value: '<p>Test</p>' }],
    summary: [{ locale: 'en', value: 'Brief summary' }],
    durationISO: 'PT2H',
    minParticipants: 1,
    maxParticipants: 10,
    rates: [
      {
        title: 'Standard',
        currency: 'SEK',
        pricePerBooking: false,
        pricingCategories: [{ title: 'Adult', pricePerCategoryUnit: '199.00' }],
      },
    ],
    meetingPoint: {
      title: [{ locale: 'en', value: 'Central Station' }],
    },
  }
}

describe('BokunApiClient.createExperience', () => {
  let client: BokunApiClient

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('BOKUN_API_KEY', 'test-access-key')
    vi.stubEnv('BOKUN_SECRET_KEY', 'test-secret-key')
    vi.stubEnv('NODE_ENV', 'test')
    client = new BokunApiClient()
  })

  it('POSTs to /restapi/v2.0/experience', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'exp_123' }, 201))
    await client.createExperience(buildPayload())
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toContain('/restapi/v2.0/experience')
    expect(init.method).toBe('POST')
  })

  it('serializes payload as JSON body', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'exp_123' }, 201))
    const payload = buildPayload()
    await client.createExperience(payload)
    const [, init] = mockFetch.mock.calls[0]
    expect(init.body).toBe(JSON.stringify(payload))
  })

  it('sends HMAC signature headers', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'exp_123' }, 201))
    await client.createExperience(buildPayload())
    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers['X-Bokun-AccessKey']).toBe('test-access-key')
    expect(init.headers['X-Bokun-Signature']).toBeDefined()
    expect(init.headers['X-Bokun-Date']).toBeDefined()
  })

  it('returns the parsed response body', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'exp_xyz', status: 'CREATED' }, 201))
    const res = await client.createExperience(buildPayload())
    expect(res.id).toBe('exp_xyz')
    expect(res.status).toBe('CREATED')
  })

  it('propagates BokunError on 400 (validation failure, no retry)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: 'Missing field', errorCode: 'VALIDATION' }, 400)
    )
    await expect(client.createExperience(buildPayload())).rejects.toThrow(BokunError)
    expect(mockFetch).toHaveBeenCalledTimes(1) // no retry on 4xx
  })

  it('preserves monetary values as strings in payload', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({ id: 'x' }, 201))
    const payload = buildPayload()
    await client.createExperience(payload)
    const [, init] = mockFetch.mock.calls[0]
    expect(init.body).toContain('"pricePerCategoryUnit":"199.00"')
    // Verify the value was not coerced to a number anywhere in transit
    expect(init.body).not.toContain('"pricePerCategoryUnit":199')
  })

  it('retries on 429 then succeeds (reuses fetch backoff)', async () => {
    vi.useFakeTimers()
    mockFetch
      .mockResolvedValueOnce(mockResponse({}, 429, { 'Retry-After': '1' }))
      .mockResolvedValueOnce(mockResponse({ id: 'exp_after_retry' }, 201))

    const promise = client.createExperience(buildPayload())
    await vi.advanceTimersByTimeAsync(2000)

    const result = await promise
    expect(result.id).toBe('exp_after_retry')
    expect(mockFetch).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })
})

describe('BokunApiClient.updateExperience', () => {
  let client: BokunApiClient

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('BOKUN_API_KEY', 'test-access-key')
    vi.stubEnv('BOKUN_SECRET_KEY', 'test-secret-key')
    vi.stubEnv('NODE_ENV', 'test')
    client = new BokunApiClient()
  })

  it('PUTs to /restapi/v2.0/experience/{id}/components', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 204))
    await client.updateExperience('exp_42', { summary: [{ locale: 'en', value: 'New' }] })
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toContain('/restapi/v2.0/experience/exp_42/components')
    expect(init.method).toBe('PUT')
  })

  it('URL-encodes the experience id (defense against injection)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 204))
    await client.updateExperience('id with/slash', {})
    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('/restapi/v2.0/experience/id%20with%2Fslash/components')
  })

  it('passes partial payload through unchanged', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse({}, 204))
    const partial: BokunExperienceUpdatePayload = {
      summary: [{ locale: 'sv', value: 'Uppdatering' }],
    }
    await client.updateExperience('exp_42', partial)
    const [, init] = mockFetch.mock.calls[0]
    expect(init.body).toBe(JSON.stringify(partial))
  })

  it('propagates BokunError on 404 (id not found)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ message: 'Not Found', errorCode: 'NOT_FOUND' }, 404)
    )
    await expect(client.updateExperience('missing', {})).rejects.toThrow(BokunError)
  })
})
