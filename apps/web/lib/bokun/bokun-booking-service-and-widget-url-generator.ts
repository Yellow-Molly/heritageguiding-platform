/**
 * Bokun booking service for creating bookings and generating widget URLs
 * Handles booking creation via API and widget checkout URL generation
 */

import { bokunClient } from './bokun-api-client-with-hmac-authentication'
import type {
  BokunBooking,
  CreateBookingRequest,
  BookingResponse,
} from './bokun-types'

/**
 * Create a booking via Bokun API.
 * Returns booking confirmation and optional checkout URL for payment.
 *
 * @param params - Booking request parameters
 * @returns Booking response with confirmation details
 */
export async function createBokunBooking(
  params: CreateBookingRequest
): Promise<BookingResponse> {
  const requestBody = {
    experienceId: params.experienceId,
    startTimeId: params.startTimeId,
    customer: {
      firstName: params.customer.firstName,
      lastName: params.customer.lastName,
      email: params.customer.email,
      phone: params.customer.phone || '',
      nationality: params.customer.nationality || '',
    },
    participants: params.participants,
    notes: params.notes || '',
    promoCode: params.promoCode,
  }

  const response = await bokunClient.post<BookingResponse>(
    '/restapi/v2.0/booking',
    requestBody
  )

  return response
}

/**
 * Get booking details by booking ID.
 *
 * @param bookingId - Bokun booking ID
 * @returns Full booking details
 */
export async function getBokunBooking(bookingId: string): Promise<BokunBooking> {
  const response = await bokunClient.get<{ booking: BokunBooking }>(
    `/restapi/v2.0/booking/${bookingId}`
  )
  return response.booking
}

/**
 * Get booking details by confirmation code.
 *
 * @param confirmationCode - Human-readable confirmation code
 * @returns Full booking details
 */
export async function getBokunBookingByConfirmationCode(
  confirmationCode: string
): Promise<BokunBooking> {
  const response = await bokunClient.get<{ booking: BokunBooking }>(
    `/restapi/v2.0/booking/confirmation/${confirmationCode}`
  )
  return response.booking
}

/**
 * Cancel a booking.
 *
 * @param bookingId - Bokun booking ID
 * @returns Updated booking with cancelled status
 */
export async function cancelBokunBooking(bookingId: string): Promise<BokunBooking> {
  const response = await bokunClient.post<{ booking: BokunBooking }>(
    `/restapi/v2.0/booking/${bookingId}/cancel`,
    {}
  )
  return response.booking
}

// ============================================================================
// WIDGET URL GENERATORS
// ============================================================================

/**
 * Bokun widget base URL
 */
const BOKUN_WIDGET_BASE_URL = 'https://widgets.bokun.io/online-sales'

/**
 * Generate Bokun widget checkout URL for embedded calendar experience.
 * This URL is used in iframe-based widget embedding.
 *
 * @param bookingChannelUUID - Booking channel UUID from Bokun dashboard
 * @param experienceId - Experience/activity ID
 * @returns Full widget URL for iframe embedding
 */
export function getBokunWidgetUrl(
  bookingChannelUUID: string,
  experienceId: string
): string {
  return `${BOKUN_WIDGET_BASE_URL}/${bookingChannelUUID}/experience-calendar/${experienceId}`
}

/**
 * Generate Bokun widget script URL for loading widget loader.
 *
 * @param bookingChannelUUID - Booking channel UUID from Bokun dashboard
 * @returns Widget script URL
 */
export function getBokunWidgetScriptUrl(bookingChannelUUID: string): string {
  return `https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js?bookingChannelUUID=${bookingChannelUUID}`
}

/**
 * Generate direct checkout URL for a specific experience.
 * Used when redirecting user to Bokun hosted checkout page.
 *
 * @param bookingChannelUUID - Booking channel UUID from Bokun dashboard
 * @param experienceId - Experience/activity ID
 * @param options - Optional parameters for pre-filling checkout
 * @returns Checkout URL for redirect
 */
export function getBokunCheckoutUrl(
  bookingChannelUUID: string,
  experienceId: string,
  options?: {
    date?: string // YYYY-MM-DD
    startTimeId?: string
    participants?: number
    locale?: string
  }
): string {
  const baseUrl = `${BOKUN_WIDGET_BASE_URL}/${bookingChannelUUID}/experience/${experienceId}`

  if (!options) {
    return baseUrl
  }

  const params = new URLSearchParams()

  if (options.date) {
    params.set('date', options.date)
  }
  if (options.startTimeId) {
    params.set('startTimeId', options.startTimeId)
  }
  if (options.participants) {
    params.set('participants', options.participants.toString())
  }
  if (options.locale) {
    params.set('lang', options.locale)
  }

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Generate embed code for Bokun widget (for documentation/admin use).
 *
 * @param bookingChannelUUID - Booking channel UUID from Bokun dashboard
 * @param experienceId - Experience/activity ID
 * @returns HTML embed code snippet
 */
export function getBokunEmbedCode(
  bookingChannelUUID: string,
  experienceId: string
): string {
  const widgetUrl = getBokunWidgetUrl(bookingChannelUUID, experienceId)
  const scriptUrl = getBokunWidgetScriptUrl(bookingChannelUUID)

  return `<!-- Bokun Booking Widget -->
<div class="bokunWidget" data-src="${widgetUrl}"></div>
<script type="text/javascript" src="${scriptUrl}" async></script>`
}
