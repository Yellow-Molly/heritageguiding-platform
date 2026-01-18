import type { Field } from 'payload'

/**
 * WCAG accessibility fields for tour content
 * Helps users with disabilities find suitable tours
 */
export const accessibilityFields: Field[] = [
  {
    name: 'wheelchairAccessible',
    type: 'checkbox',
    defaultValue: false,
    label: 'Wheelchair Accessible',
    admin: {
      description: 'Entire tour route is wheelchair accessible',
    },
  },
  {
    name: 'mobilityNotes',
    type: 'textarea',
    localized: true,
    label: 'Mobility Notes',
    admin: {
      description: 'Additional mobility/accessibility information',
    },
  },
  {
    name: 'hearingAssistance',
    type: 'checkbox',
    defaultValue: false,
    label: 'Hearing Assistance Available',
  },
  {
    name: 'visualAssistance',
    type: 'checkbox',
    defaultValue: false,
    label: 'Visual Assistance Available',
  },
  {
    name: 'serviceAnimalsAllowed',
    type: 'checkbox',
    defaultValue: true,
    label: 'Service Animals Allowed',
  },
]
