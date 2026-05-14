/**
 * Bokun API client with HMAC signature authentication
 * Handles rate limiting with exponential backoff
 * Supports both test (api.bokuntest.com) and prod (api.bokun.io) environments
 */

import { createHmac } from 'crypto'
import type {
  BokunApiError,
  BokunExperienceCreatePayload,
  BokunExperienceCreateResponse,
  BokunExperienceUpdatePayload,
  BokunExperienceUpdateResponse,
} from './bokun-types'
import { serializeBokunExperiencePayload } from './serialize-bokun-wire-payload'

// Bokun API base URLs
const BOKUN_TEST_URL = 'https://api.bokuntest.com'
const BOKUN_PROD_URL = 'https://api.bokun.io'

// Rate limiting constants
const MAX_RETRIES = 3
const MAX_BACKOFF_MS = 30000

/**
 * Custom error class for Bokun API errors.
 *
 * Fields declared explicitly (rather than via TypeScript parameter properties)
 * so the class remains valid under Node's `--experimental-strip-types` loader,
 * which only erases types and cannot transform parameter properties. Payload's
 * `migrate` CLI on Vercel (Node 24) loads this file directly via that loader.
 */
export class BokunError extends Error {
  status: number
  errorCode?: string

  constructor(message: string, status: number, errorCode?: string) {
    super(message)
    this.name = 'BokunError'
    this.status = status
    this.errorCode = errorCode
  }
}

/**
 * Bokun API client with HMAC signature authentication.
 * Implements retry with exponential backoff for rate limiting.
 */
export class BokunApiClient {
  private accessKey: string
  private secretKey: string
  private baseUrl: string

  constructor() {
    const accessKey = process.env.BOKUN_API_KEY
    const secretKey = process.env.BOKUN_SECRET_KEY

    // Fail fast: refuse to construct an unauthenticated client. Eliminates the
    // class of bug where empty creds silently produce HMAC-with-empty-secret
    // and yield Bokun 401s rather than a clear configuration error at startup.
    if (!accessKey || !secretKey) {
      throw new BokunError(
        'Bokun credentials missing: set BOKUN_API_KEY and BOKUN_SECRET_KEY',
        500,
        'CREDENTIALS_MISSING'
      )
    }

    this.accessKey = accessKey
    this.secretKey = secretKey
    this.baseUrl = process.env.NODE_ENV === 'production' ? BOKUN_PROD_URL : BOKUN_TEST_URL
  }

  /**
   * Generate HMAC signature for Bokun API authentication.
   * Signature format: HMAC-SHA1(secretKey, date + accessKey + method + path)
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param path - API endpoint path (e.g., /restapi/v2.0/activity/123/availabilities)
   * @param date - Bokun-formatted UTC date string ("yyyy-MM-dd HH:mm:ss")
   * @returns Base64-encoded HMAC signature
   */
  private generateSignature(method: string, path: string, date: string): string {
    const stringToSign = `${date}${this.accessKey}${method.toUpperCase()}${path}`
    const hmac = createHmac('sha1', this.secretKey)
    hmac.update(stringToSign)
    return hmac.digest('base64')
  }

  /**
   * Format a Date as the UTC string Bokun's HMAC scheme expects:
   * "yyyy-MM-dd HH:mm:ss" (space separator, no milliseconds, no timezone suffix).
   *
   * Bokun rejects ISO-8601 (`...T...Z`) with HTTP 403 because the signature
   * input is concatenated verbatim — any deviation from the documented format
   * breaks server-side HMAC verification.
   * @see https://bokun.dev — "Configuring the platform for API usage and authentication"
   */
  private formatBokunDate(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ')
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Calculate exponential backoff delay
   */
  private getBackoffDelay(retryAfter: number, retryCount: number): number {
    const delay = retryAfter * 1000 * Math.pow(2, retryCount)
    return Math.min(delay, MAX_BACKOFF_MS)
  }

  /**
   * Make authenticated request to Bokun API.
   * Implements retry with exponential backoff for rate limits (429).
   *
   * @param endpoint - API endpoint (e.g., /restapi/v2.0/activity/123/availabilities)
   * @param options - Fetch options
   * @param retryCount - Current retry attempt (internal use)
   * @returns Parsed JSON response
   * @throws BokunError on API errors
   */
  async fetch<T>(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<T> {
    // Credentials are validated in the constructor — fetch can trust them.
    const method = options.method || 'GET'
    const date = this.formatBokunDate(new Date())
    const signature = this.generateSignature(method, endpoint, date)

    const headers: HeadersInit = {
      'X-Bokun-AccessKey': this.accessKey,
      'X-Bokun-Date': date,
      'X-Bokun-Signature': signature,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    }

    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        if (retryCount >= MAX_RETRIES) {
          throw new BokunError('Rate limit exceeded after max retries', 429, 'RATE_LIMIT_EXCEEDED')
        }

        const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10)
        const delay = this.getBackoffDelay(retryAfter, retryCount)

        console.log(`[BokunApiClient] Rate limited. Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`)

        await this.sleep(delay)
        return this.fetch<T>(endpoint, options, retryCount + 1)
      }

      // Handle other error responses.
      // Read body as text first so we can ALWAYS surface something — Bokun's 4xx
      // responses come back in several shapes (`{message}`, `{error}`, `{errors:[]}`,
      // plain string, or empty body) and silently dropping the body leaves operators
      // staring at a bare status code with no actionable detail.
      if (!response.ok) {
        const rawBody = await response.text().catch(() => '')
        let parsed: Partial<BokunApiError> & {
          error?: string
          errors?: unknown
        } = {}
        try {
          parsed = rawBody ? JSON.parse(rawBody) : {}
        } catch {
          // body wasn't JSON — keep rawBody as-is for the message
        }

        // Server-side breadcrumb so Vercel logs always retain the full Bokun
        // response body, even when our sanitizer redacts it on the way out.
        console.error('[BokunApiClient] non-2xx response', {
          method,
          endpoint,
          status: response.status,
          body: rawBody.slice(0, 1000),
        })

        const message =
          parsed.message ||
          parsed.error ||
          (parsed.errors ? JSON.stringify(parsed.errors).slice(0, 400) : '') ||
          rawBody.slice(0, 400) ||
          response.statusText ||
          'Unknown error'
        const errorCode = parsed.errorCode || 'UNKNOWN'

        throw new BokunError(message, response.status, errorCode)
      }

      // Parse and return successful response
      return response.json()
    } catch (error) {
      // Re-throw BokunError instances
      if (error instanceof BokunError) {
        throw error
      }

      // Wrap other errors
      throw new BokunError(
        error instanceof Error ? error.message : 'Network error',
        500,
        'NETWORK_ERROR'
      )
    }
  }

  /**
   * Make GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'GET' })
  }

  /**
   * Make POST request with JSON body
   */
  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  /**
   * Make PUT request with JSON body
   */
  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  /**
   * Make DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'DELETE' })
  }

  /**
   * Create a new Experience in Bokun.
   * Endpoint: POST /restapi/v2.0/experience
   * Persist the returned `id` (or `experienceId`) on the Tour as `bokunExperienceId`.
   *
   * @param payload - Full Experience create payload (see Phase 03 mapper)
   * @returns Bokun response containing the new Experience id
   * @throws BokunError on non-2xx (4xx → no retry, 5xx/429 → retried per fetch())
   */
  async createExperience(
    payload: BokunExperienceCreatePayload
  ): Promise<BokunExperienceCreateResponse> {
    // Serialize to Bokun's ExperienceComponentsDto wire shape (flat strings, not
    // localized arrays). Internal payload retains the rich localized form for
    // future translation flows; this is the boundary where it gets flattened.
    const wireBody = serializeBokunExperiencePayload(payload)
    return this.fetch<BokunExperienceCreateResponse>('/restapi/v2.0/experience', {
      method: 'POST',
      body: JSON.stringify(wireBody),
    })
  }

  /**
   * Update an existing Experience in Bokun by replacing its components.
   * Endpoint: PUT /restapi/v2.0/experience/{id}/components
   * Bokun's update model is component-level full-replacement (no PATCH).
   *
   * @param experienceId - Bokun-assigned Experience id (URL-encoded for safety)
   * @param payload - Partial Experience payload; only included components are replaced
   * @returns Bokun response (204 No Content is common — all fields optional)
   * @throws BokunError on non-2xx
   */
  async updateExperience(
    experienceId: string,
    payload: BokunExperienceUpdatePayload
  ): Promise<BokunExperienceUpdateResponse> {
    const safeId = encodeURIComponent(experienceId)
    const wireBody = serializeBokunExperiencePayload(payload)
    return this.fetch<BokunExperienceUpdateResponse>(
      `/restapi/v2.0/experience/${safeId}/components`,
      {
        method: 'PUT',
        body: JSON.stringify(wireBody),
      }
    )
  }
}

// Lazy singleton: instantiated on first call rather than at module load.
// Avoids throwing CREDENTIALS_MISSING during build-time module evaluation
// (e.g. typegen, route discovery) when env vars are not yet available.
// Each worker scopes its own instance via module-level caching.
let _bokunClient: BokunApiClient | null = null

export function getBokunClient(): BokunApiClient {
  if (!_bokunClient) {
    _bokunClient = new BokunApiClient()
  }
  return _bokunClient
}

// Test helper: clears the cached instance so the next getBokunClient() call
// re-runs the constructor against current vi.stubEnv values. Double-underscore
// prefix signals "internal/test only" (React/Jest/Vitest convention).
export function __resetBokunClientForTests(): void {
  _bokunClient = null
}
