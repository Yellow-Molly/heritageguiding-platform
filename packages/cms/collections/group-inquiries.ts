import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Group inquiry collection for tracking large group booking requests (20+ people).
 * Admin reviews inquiries and creates Bokun bookings manually.
 */
export const GroupInquiries: CollectionConfig = {
  slug: 'group-inquiries',
  admin: {
    useAsTitle: 'customerName',
    defaultColumns: ['customerName', 'groupSize', 'status', 'preferredDates', 'createdAt'],
    group: 'Bookings',
    description: 'Group booking inquiries for 20+ people',
  },
  access: {
    read: isAdmin,
    create: () => true, // Public form submission
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    // ===== CUSTOMER INFO =====
    {
      name: 'customerName',
      type: 'text',
      required: true,
      admin: { description: 'Full name (first + last)' },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
      admin: { description: 'Customer email address' },
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      admin: { description: 'Customer phone number' },
    },

    // ===== INQUIRY DETAILS =====
    {
      name: 'groupSize',
      type: 'number',
      required: true,
      min: 20,
      max: 200,
      admin: { description: 'Number of people in group' },
    },
    {
      name: 'preferredDates',
      type: 'text',
      required: true,
      admin: { description: 'Preferred tour dates' },
    },
    {
      name: 'tourInterest',
      type: 'text',
      admin: { description: 'Tours the customer is interested in' },
    },
    {
      name: 'specialRequirements',
      type: 'textarea',
      admin: { description: 'Accessibility, dietary, or other requirements' },
    },

    // ===== STATUS TRACKING =====
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Booked', value: 'booked' },
        { label: 'Declined', value: 'declined' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      admin: {
        description: 'Internal notes (quote details, Bokun booking ref, etc.)',
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
