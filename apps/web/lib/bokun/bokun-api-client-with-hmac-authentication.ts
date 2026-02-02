/**
 * Bokun API client with HMAC signature authentication
 * Handles rate limiting with exponential backoff
 * Supports both test (api.bokuntest.com) and prod (api.bokun.io) environments
 */

import { createHmac } from 'crypto'
import type { BokunApiError } from './bokun-types'

// Bokun API base URLs
const BOKUN_TEST_URL = 'https://api.bokuntest.com'
const BOKUN_PROD_URL = 'https://api.bokun.io'

// Rate limiting constants
const MAX_RETRIES = 3
const MAX_BACKOFF_MS = 30000

/**
 * Custom error class for Bokun API errors
 */
export class BokunError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode?: string
  ) {
    super(message)
    this.name = 'BokunError'
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
    this.accessKey = process.env.BOKUN_API_KEY || ''
    this.secretKey = process.env.BOKUN_SECRET_KEY || ''
    this.baseUrl = process.env.NODE_ENV === 'production' ? BOKUN_PROD_URL : BOKUN_TEST_URL
  }

  /**
   * Check if client is properly configured with credentials.
   * In production, throws if not configured.
   */
  isConfigured(): boolean {
    const configured = Boolean(this.accessKey && this.secretKey)

    if (!configured && process.env.NODE_ENV === 'production') {
      throw new BokunError(
        'BOKUN_API_KEY and BOKUN_SECRET_KEY are required in production',
        500,
        'CREDENTIALS_MISSING'
      )
    }

    return configured
  }

  /**
   * Generate HMAC signature for Bokun API authentication.
   * Signature format: HMAC-SHA1(secretKey, date + accessKey + method + path)
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param path - API endpoint path (e.g., /restapi/v2.0/activity/123/availabilities)
   * @param date - ISO date string
   * @returns Base64-encoded HMAC signature
   */
  private generateSignature(method: string, path: string, date: string): string {
    const stringToSign = `${date}${this.accessKey}${method.toUpperCase()}${path}`
    const hmac = createHmac('sha1', this.secretKey)
    hmac.update(stringToSign)
    return hmac.digest('base64')
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
    if (!this.isConfigured()) {
      throw new BokunError('Bokun API credentials not configured', 401, 'CREDENTIALS_MISSING')
    }

    const method = options.method || 'GET'
    const date = new Date().toISOString()
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

      // Handle other error responses
      if (!response.ok) {
        let errorData: BokunApiError
        try {
          errorData = await response.json()
        } catch {
          errorData = {
            errorCode: 'UNKNOWN',
            message: response.statusText || 'Unknown error',
          }
        }

        throw new BokunError(errorData.message, response.status, errorData.errorCode)
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
}

// Module-level singleton instance (Node.js modules are cached)
export const bokunClient = new BokunApiClient()

// Alias for backwards compatibility
export const getBokunClient = () => bokunClient
