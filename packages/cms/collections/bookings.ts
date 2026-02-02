import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Bookings collection for tracking Bokun webhook data
 * Stores booking confirmations, status updates, and customer info
 * Used for local tracking, email notifications, and reconciliation
 */
export const Bookings: CollectionConfig = {
  slug: 'bookings',
  admin: {
    useAsTitle: 'confirmationCode',
    defaultColumns: ['confirmationCode', 'status', 'customerEmail', 'totalPrice', 'createdAt'],
    group: 'Bookings',
    description: 'Booking records from Bokun webhook events',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    // ===== BOKUN IDENTIFIERS =====
    {
      name: 'bokunBookingId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique booking ID from Bokun',
        readOnly: true,
      },
    },
    {
      name: 'confirmationCode',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Human-readable confirmation code',
        readOnly: true,
      },
    },

    // ===== STATUS =====
    {
      name: 'status',
      type: 'select',
      required: true,
      index: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'On Hold', value: 'on_hold' },
      ],
      admin: {
        position: 'sidebar',
      },
    },

    // ===== CUSTOMER INFO =====
    {
      name: 'customerName',
      type: 'text',
      required: true,
      admin: {
        description: 'Customer full name',
      },
    },
    {
      name: 'customerEmail',
      type: 'email',
      required: true,
      index: true,
      admin: {
        description: 'Customer email address',
      },
    },
    {
      name: 'customerPhone',
      type: 'text',
      admin: {
        description: 'Customer phone number',
      },
    },

    // ===== TOUR REFERENCE =====
    {
      name: 'tour',
      type: 'relationship',
      relationTo: 'tours',
      admin: {
        description: 'Related tour (if matched by experience ID)',
      },
    },
    {
      name: 'bokunExperienceId',
      type: 'text',
      index: true,
      admin: {
        description: 'Bokun experience ID for tour matching',
        readOnly: true,
      },
    },

    // ===== BOOKING DETAILS =====
    {
      name: 'bookingDate',
      type: 'date',
      admin: {
        description: 'Date of the tour/experience',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'startTime',
      type: 'text',
      admin: {
        description: 'Start time of the tour (HH:mm)',
      },
    },
    {
      name: 'participants',
      type: 'number',
      min: 1,
      admin: {
        description: 'Total number of participants',
      },
    },

    // ===== PRICING =====
    {
      name: 'totalPrice',
      type: 'text',
      required: true,
      admin: {
        description: 'Total price (string format from Bokun)',
        readOnly: true,
      },
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      defaultValue: 'SEK',
      admin: {
        description: 'Currency code (SEK, EUR, USD)',
        readOnly: true,
      },
    },

    // ===== WEBHOOK TRACKING =====
    {
      name: 'lastWebhookEvent',
      type: 'select',
      options: [
        { label: 'Booking Created', value: 'BOOKING_CREATED' },
        { label: 'Booking Confirmed', value: 'BOOKING_CONFIRMED' },
        { label: 'Booking Cancelled', value: 'BOOKING_CANCELLED' },
        { label: 'Booking Modified', value: 'BOOKING_MODIFIED' },
        { label: 'Payment Received', value: 'PAYMENT_RECEIVED' },
        { label: 'Payment Failed', value: 'PAYMENT_FAILED' },
      ],
      admin: {
        description: 'Most recent webhook event type',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'webhookReceivedAt',
      type: 'date',
      admin: {
        description: 'When last webhook was received',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        readOnly: true,
      },
    },

    // ===== NOTIFICATIONS =====
    {
      name: 'confirmationEmailSent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether confirmation email was sent',
        position: 'sidebar',
      },
    },
    {
      name: 'confirmationEmailSentAt',
      type: 'date',
      admin: {
        description: 'When confirmation email was sent',
        condition: (data) => data?.confirmationEmailSent,
      },
    },

    // ===== RAW DATA =====
    {
      name: 'rawPayload',
      type: 'json',
      admin: {
        description: 'Raw webhook payload for debugging',
        readOnly: true,
      },
    },

    // ===== NOTES =====
    {
      name: 'internalNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes (not visible to customer)',
      },
    },
  ],
  timestamps: true,
}
