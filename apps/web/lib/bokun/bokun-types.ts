/**
 * Bokun API TypeScript types
 * Based on Bokun REST API v2.0 specification
 * All monetary values are strings per Bokun API requirement (never floats)
 */

// ============================================================================
// AVAILABILITY TYPES
// ============================================================================

/**
 * Bokun availability slot from API
 */
export interface BokunAvailability {
  /** Date in ISO format (YYYY-MM-DD) */
  date: string
  /** Start time in HH:mm format */
  startTime: string
  /** Unique identifier for this time slot */
  startTimeId: string
  /** Whether capacity is unlimited */
  unlimitedAvailability: boolean
  /** Number of spots available */
  availabilityCount: number
  /** Number of participants already booked */
  bookedParticipants: number
  /** Minimum required participants */
  minParticipants: number
  /** Pricing rates for this slot */
  rates: BokunRate[]
}

/**
 * Price rate for a specific participant type
 */
export interface BokunRate {
  /** Number of participants */
  participantCount: number
  /** Age band identifier (ADULT, CHILD, SENIOR, etc.) */
  ageBand?: string
  /** Price as string (never use float for monetary values) */
  price: string
  /** Currency code (EUR, SEK, USD, etc.) */
  currency: string
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

/**
 * Bokun booking object
 */
export interface BokunBooking {
  /** Unique booking ID */
  id: string
  /** Human-readable confirmation code */
  confirmationCode: string
  /** Booking status */
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'ON_HOLD'
  /** Customer information */
  customerDetails: BokunCustomer
  /** Individual product bookings */
  productBookings: BokunProductBooking[]
  /** Total price as string */
  totalPrice: string
  /** Currency code */
  currency: string
  /** Creation timestamp (UTC milliseconds) */
  createdAt: number
  /** Last update timestamp (UTC milliseconds) */
  updatedAt?: number
}

/**
 * Customer details for a booking
 */
export interface BokunCustomer {
  /** First name */
  firstName: string
  /** Last name */
  lastName: string
  /** Email address */
  email: string
  /** Phone number */
  phone?: string
  /** Country code (ISO 2-letter) */
  nationality?: string
  /** Additional notes from customer */
  notes?: string
}

/**
 * Individual product/experience booking within a booking
 */
export interface BokunProductBooking {
  /** Time slot ID */
  startTimeId: string
  /** Experience/activity ID */
  experienceId: string
  /** List of participants */
  participants: BokunParticipant[]
  /** Special requests or notes */
  notes?: string
  /** Start date */
  date: string
  /** Start time */
  startTime: string
}

/**
 * Participant in a booking
 */
export interface BokunParticipant {
  /** Age band (ADULT, CHILD, INFANT, SENIOR) */
  ageBand: string
  /** Number of participants in this age band */
  count: number
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Webhook event types from Bokun
 */
export type BokunWebhookEvent =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_MODIFIED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'

/**
 * Webhook payload from Bokun
 */
export interface BokunWebhookPayload {
  /** Event type */
  event: BokunWebhookEvent
  /** Booking ID */
  bookingId: string
  /** Full booking object */
  booking: BokunBooking
  /** Event timestamp (UTC milliseconds) */
  timestamp: number
  /** Vendor ID */
  vendorId?: string
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Bokun API error response
 */
export interface BokunApiError {
  /** Error code */
  errorCode: string
  /** Error message */
  message: string
  /** Additional error details */
  details?: string
  /** HTTP status code */
  status?: number
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Request parameters for fetching availability
 */
export interface AvailabilityRequest {
  /** Experience/activity ID from Bokun */
  experienceId: string
  /** Start date (YYYY-MM-DD) */
  startDate: string
  /** End date (YYYY-MM-DD) */
  endDate: string
}

/**
 * Request parameters for creating a booking
 */
export interface CreateBookingRequest {
  /** Experience/activity ID */
  experienceId: string
  /** Time slot ID from availability */
  startTimeId: string
  /** Customer details */
  customer: BokunCustomer
  /** List of participants by age band */
  participants: BokunParticipant[]
  /** Special requests */
  notes?: string
  /** Promotional code */
  promoCode?: string
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Response from availability endpoint
 */
export interface AvailabilityResponse {
  /** List of available time slots */
  availabilities: BokunAvailability[]
}

/**
 * Response from booking creation
 */
export interface BookingResponse {
  /** Created booking */
  booking: BokunBooking
  /** Checkout URL for redirect flow (if applicable) */
  checkoutUrl?: string
}

// ============================================================================
// WIDGET TYPES
// ============================================================================

/**
 * Configuration for Bokun widget embedding
 */
export interface BokunWidgetConfig {
  /** Booking channel UUID from Bokun dashboard */
  bookingChannelUUID: string
  /** Experience ID to display */
  experienceId: string
  /** Optional locale for widget (en, sv, de) */
  locale?: string
  /** Optional custom styling */
  style?: {
    primaryColor?: string
    backgroundColor?: string
  }
}
