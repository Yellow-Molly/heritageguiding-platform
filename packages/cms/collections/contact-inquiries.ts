import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Contact inquiry collection for persisting contact form submissions.
 * Public create access for form submissions, admin-only for management.
 */
export const ContactInquiries: CollectionConfig = {
  slug: 'contact-inquiries',
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'email', 'subject', 'status', 'createdAt'],
    group: 'Inquiries',
    description: 'Contact form submissions from the website',
  },
  access: {
    read: isAdmin,
    // Only allow creation via local API (our /api/contact route), not via Payload REST
    create: ({ req }) => req.payloadAPI === 'local',
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    // ===== CONTACT INFO =====
    {
      name: 'fullName',
      type: 'text',
      required: true,
      admin: { description: 'Full name of the sender' },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
      admin: { description: 'Sender email address' },
    },
    {
      name: 'phone',
      type: 'text',
      admin: { description: 'Phone number (optional)' },
    },

    // ===== INQUIRY DETAILS =====
    {
      name: 'subject',
      type: 'select',
      required: true,
      options: [
        { label: 'General Inquiry', value: 'general' },
        { label: 'Tour Booking', value: 'tour_booking' },
        { label: 'Group Inquiry', value: 'group_inquiry' },
        { label: 'Partnership', value: 'partnership' },
        { label: 'Other', value: 'other' },
      ],
      admin: { description: 'Subject category of the inquiry' },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: { description: 'Message content' },
    },

    // ===== STATUS TRACKING =====
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Read', value: 'read' },
        { label: 'Replied', value: 'replied' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this inquiry',
        position: 'sidebar',
      },
    },
    {
      name: 'notificationSent',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether admin notification email was sent',
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
