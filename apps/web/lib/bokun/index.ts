/**
 * Bokun integration module exports
 * Provides API client, availability, booking services, and types
 */

// Types
export * from './bokun-types'

// API Client
export {
  BokunApiClient,
  BokunError,
  getBokunClient,
} from './bokun-api-client-with-hmac-authentication'

// Tour → Experience transform (pure)
export {
  tourToBokunExperiencePayload,
  type TourSource,
} from './tour-to-bokun-experience-mapper'

// Availability Service
export {
  getBokunAvailability,
  getCachedBokunAvailability,
  groupAvailabilityByDate,
  getAvailableDates,
  getTimeSlotsForDate,
  getLowestPrice,
  hasAvailability,
} from './bokun-availability-service-with-caching'

// Booking Service
export {
  createBokunBooking,
  getBokunBooking,
  getBokunBookingByConfirmationCode,
  cancelBokunBooking,
  getBokunWidgetUrl,
  getBokunWidgetScriptUrl,
  getBokunCheckoutUrl,
  getBokunEmbedCode,
} from './bokun-booking-service-and-widget-url-generator'
