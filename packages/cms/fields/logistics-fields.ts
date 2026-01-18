import type { Field } from 'payload'

/**
 * URL validation for Google Maps links
 * Allows google.com/maps, goo.gl/maps, or maps.google.com URLs
 */
export const validateGoogleMapsUrl = (value: string | undefined | null): true | string => {
  if (!value) return true
  const validPatterns = [
    /^https?:\/\/(www\.)?google\.(com|[a-z]{2,3})\/maps/i,
    /^https?:\/\/goo\.gl\/maps/i,
    /^https?:\/\/maps\.google\.(com|[a-z]{2,3})/i,
    /^https?:\/\/maps\.app\.goo\.gl/i,
  ]
  const isValid = validPatterns.some((pattern) => pattern.test(value))
  return isValid || 'Please enter a valid Google Maps URL'
}

/**
 * Logistics fields for tour meeting point and transportation info
 * Includes GPS coordinates for Google Maps integration
 */
export const logisticsFields: Field[] = [
  {
    name: 'meetingPointName',
    type: 'text',
    required: true,
    localized: true,
    maxLength: 200,
    label: 'Meeting Point Name',
    admin: {
      description: 'e.g., "Gustav Adolfs Torg" or "City Hall entrance"',
    },
  },
  {
    name: 'meetingPointAddress',
    type: 'text',
    localized: true,
    maxLength: 300,
    label: 'Meeting Point Address',
  },
  {
    name: 'coordinates',
    type: 'point',
    label: 'GPS Coordinates',
    admin: {
      description: 'Click on map or enter lat/lng for meeting point',
    },
  },
  {
    name: 'googleMapsLink',
    type: 'text',
    maxLength: 500,
    label: 'Google Maps Link',
    validate: validateGoogleMapsUrl,
    admin: {
      description: 'Direct link to Google Maps location',
    },
  },
  {
    name: 'meetingPointInstructions',
    type: 'textarea',
    localized: true,
    maxLength: 1000,
    label: 'Meeting Instructions',
    admin: {
      description: 'How to find the guide at the meeting point',
    },
  },
  {
    name: 'endingPoint',
    type: 'text',
    localized: true,
    maxLength: 200,
    label: 'Ending Point',
    admin: {
      description: 'Where the tour ends (if different from start)',
    },
  },
  {
    name: 'parkingInfo',
    type: 'textarea',
    localized: true,
    maxLength: 500,
    label: 'Parking Information',
  },
  {
    name: 'publicTransportInfo',
    type: 'textarea',
    localized: true,
    maxLength: 500,
    label: 'Public Transport Information',
  },
]
