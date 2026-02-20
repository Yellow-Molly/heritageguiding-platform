/**
 * Tests for Bokun booking service and widget URL generator
 * Covers: createBokunBooking, getBokunBooking, getBokunBookingByConfirmationCode,
 * cancelBokunBooking, getBokunWidgetUrl, getBokunWidgetScriptUrl,
 * getBokunCheckoutUrl, getBokunEmbedCode
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so mock variables are available inside the vi.mock factory
const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}))
vi.mock('../bokun-api-client-with-hmac-authentication', () => ({
  bokunClient: { get: mockGet, post: mockPost },
}))

import {
  createBokunBooking,
  getBokunBooking,
  getBokunBookingByConfirmationCode,
  cancelBokunBooking,
  getBokunWidgetUrl,
  getBokunWidgetScriptUrl,
  getBokunCheckoutUrl,
  getBokunEmbedCode,
} from '../bokun-booking-service-and-widget-url-generator'
import type { BokunBooking, BookingResponse, CreateBookingRequest } from '../bokun-types'

// Minimal BokunBooking fixture
const mockBooking: BokunBooking = {
  id: 'booking-123',
  confirmationCode: 'CONF-ABC',
  status: 'CONFIRMED',
  customerDetails: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  },
  productBookings: [],
  totalPrice: '1000',
  currency: 'SEK',
  createdAt: 1700000000000,
}

const mockBookingResponse: BookingResponse = {
  booking: mockBooking,
  checkoutUrl: 'https://checkout.bokun.io/pay/123',
}

// Minimal CreateBookingRequest fixture
const mockCreateRequest: CreateBookingRequest = {
  experienceId: 'exp-456',
  startTimeId: 'slot-789',
  customer: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+46701234567',
    nationality: 'SE',
  },
  participants: [{ ageBand: 'ADULT', count: 2 }],
  notes: 'Window seat please',
  promoCode: 'PROMO10',
}

// ============================================================================
// createBokunBooking
// ============================================================================
describe('createBokunBooking', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts to /restapi/v2.0/booking endpoint', async () => {
    mockPost.mockResolvedValueOnce(mockBookingResponse)
    await createBokunBooking(mockCreateRequest)
    expect(mockPost).toHaveBeenCalledWith('/restapi/v2.0/booking', expect.any(Object))
  })

  it('maps customer fields correctly in request body', async () => {
    mockPost.mockResolvedValueOnce(mockBookingResponse)
    await createBokunBooking(mockCreateRequest)
    const body = mockPost.mock.calls[0][1]
    expect(body.customer.firstName).toBe('Jane')
    expect(body.customer.lastName).toBe('Smith')
    expect(body.customer.email).toBe('jane@example.com')
    expect(body.customer.phone).toBe('+46701234567')
    expect(body.customer.nationality).toBe('SE')
  })

  it('defaults phone to empty string when not provided', async () => {
    mockPost.mockResolvedValueOnce(mockBookingResponse)
    const reqWithoutPhone: CreateBookingRequest = {
      ...mockCreateRequest,
      customer: { ...mockCreateRequest.customer, phone: undefined },
    }
    await createBokunBooking(reqWithoutPhone)
    const body = mockPost.mock.calls[0][1]
    expect(body.customer.phone).toBe('')
  })

  it('defaults nationality to empty string when not provided', async () => {
    mockPost.mockResolvedValueOnce(mockBookingResponse)
    const reqWithoutNationality: CreateBookingRequest = {
      ...mockCreateRequest,
      customer: { ...mockCreateRequest.customer, nationality: undefined },
    }
    await createBokunBooking(reqWithoutNationality)
    const body = mockPost.mock.calls[0][1]
    expect(body.customer.nationality).toBe('')
  })

  it('returns the full BookingResponse from API', async () => {
    mockPost.mockResolvedValueOnce(mockBookingResponse)
    const result = await createBokunBooking(mockCreateRequest)
    expect(result).toEqual(mockBookingResponse)
  })
})

// ============================================================================
// getBokunBooking
// ============================================================================
describe('getBokunBooking', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls GET /restapi/v2.0/booking/{id}', async () => {
    mockGet.mockResolvedValueOnce({ booking: mockBooking })
    await getBokunBooking('booking-123')
    expect(mockGet).toHaveBeenCalledWith('/restapi/v2.0/booking/booking-123')
  })

  it('returns the booking object from response', async () => {
    mockGet.mockResolvedValueOnce({ booking: mockBooking })
    const result = await getBokunBooking('booking-123')
    expect(result).toEqual(mockBooking)
  })
})

// ============================================================================
// getBokunBookingByConfirmationCode
// ============================================================================
describe('getBokunBookingByConfirmationCode', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls GET /restapi/v2.0/booking/confirmation/{code}', async () => {
    mockGet.mockResolvedValueOnce({ booking: mockBooking })
    await getBokunBookingByConfirmationCode('CONF-ABC')
    expect(mockGet).toHaveBeenCalledWith('/restapi/v2.0/booking/confirmation/CONF-ABC')
  })

  it('returns the booking object from response', async () => {
    mockGet.mockResolvedValueOnce({ booking: mockBooking })
    const result = await getBokunBookingByConfirmationCode('CONF-ABC')
    expect(result).toEqual(mockBooking)
  })
})

// ============================================================================
// cancelBokunBooking
// ============================================================================
describe('cancelBokunBooking', () => {
  beforeEach(() => vi.clearAllMocks())

  it('posts to /restapi/v2.0/booking/{id}/cancel', async () => {
    mockPost.mockResolvedValueOnce({ booking: mockBooking })
    await cancelBokunBooking('booking-123')
    expect(mockPost).toHaveBeenCalledWith('/restapi/v2.0/booking/booking-123/cancel', {})
  })

  it('returns the booking object from cancel response', async () => {
    const cancelledBooking: BokunBooking = { ...mockBooking, status: 'CANCELLED' }
    mockPost.mockResolvedValueOnce({ booking: cancelledBooking })
    const result = await cancelBokunBooking('booking-123')
    expect(result.status).toBe('CANCELLED')
  })
})

// ============================================================================
// getBokunWidgetUrl
// ============================================================================
describe('getBokunWidgetUrl', () => {
  it('generates correct widget URL with channel UUID and experience ID', () => {
    const url = getBokunWidgetUrl('my-channel-uuid', 'exp-999')
    expect(url).toBe('https://widgets.bokun.io/online-sales/my-channel-uuid/experience-calendar/exp-999')
  })

  it('URL contains widgets.bokun.io domain', () => {
    const url = getBokunWidgetUrl('uuid-abc', 'exp-123')
    expect(url).toContain('widgets.bokun.io')
  })
})

// ============================================================================
// getBokunWidgetScriptUrl
// ============================================================================
describe('getBokunWidgetScriptUrl', () => {
  it('generates script URL with bookingChannelUUID query param', () => {
    const url = getBokunWidgetScriptUrl('my-channel-uuid')
    expect(url).toBe(
      'https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js?bookingChannelUUID=my-channel-uuid'
    )
  })
})

// ============================================================================
// getBokunCheckoutUrl
// ============================================================================
describe('getBokunCheckoutUrl', () => {
  it('returns base URL when no options provided', () => {
    const url = getBokunCheckoutUrl('channel-uuid', 'exp-123')
    expect(url).toBe('https://widgets.bokun.io/online-sales/channel-uuid/experience/exp-123')
  })

  it('appends date param when provided', () => {
    const url = getBokunCheckoutUrl('channel-uuid', 'exp-123', { date: '2025-06-01' })
    expect(url).toContain('date=2025-06-01')
  })

  it('appends startTimeId param when provided', () => {
    const url = getBokunCheckoutUrl('channel-uuid', 'exp-123', { startTimeId: 'slot-42' })
    expect(url).toContain('startTimeId=slot-42')
  })

  it('appends participants param when provided', () => {
    const url = getBokunCheckoutUrl('channel-uuid', 'exp-123', { participants: 3 })
    expect(url).toContain('participants=3')
  })

  it('appends lang param for locale when provided', () => {
    const url = getBokunCheckoutUrl('channel-uuid', 'exp-123', { locale: 'sv' })
    expect(url).toContain('lang=sv')
  })

  it('appends all options as query params', () => {
    const url = getBokunCheckoutUrl('channel-uuid', 'exp-123', {
      date: '2025-06-01',
      startTimeId: 'slot-42',
      participants: 2,
      locale: 'en',
    })
    expect(url).toContain('date=2025-06-01')
    expect(url).toContain('startTimeId=slot-42')
    expect(url).toContain('participants=2')
    expect(url).toContain('lang=en')
  })

  it('returns base URL without query string when options object is empty', () => {
    const url = getBokunCheckoutUrl('channel-uuid', 'exp-123', {})
    expect(url).toBe('https://widgets.bokun.io/online-sales/channel-uuid/experience/exp-123')
    expect(url).not.toContain('?')
  })
})

// ============================================================================
// getBokunEmbedCode
// ============================================================================
describe('getBokunEmbedCode', () => {
  it('returns HTML string containing bokunWidget div', () => {
    const html = getBokunEmbedCode('channel-uuid', 'exp-123')
    expect(html).toContain('class="bokunWidget"')
  })

  it('includes widget URL in data-src attribute', () => {
    const html = getBokunEmbedCode('channel-uuid', 'exp-123')
    expect(html).toContain('data-src="https://widgets.bokun.io/online-sales/channel-uuid/experience-calendar/exp-123"')
  })

  it('includes script tag with widget loader src', () => {
    const html = getBokunEmbedCode('channel-uuid', 'exp-123')
    expect(html).toContain('src="https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js?bookingChannelUUID=channel-uuid"')
  })

  it('includes async attribute on script tag', () => {
    const html = getBokunEmbedCode('channel-uuid', 'exp-123')
    expect(html).toContain('async')
  })
})
