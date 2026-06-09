import { createEmailTransporter } from './create-email-transporter'
import { getEmailFrom } from './get-email-from'

/**
 * Minimal shape for a purchased add-on rendered inside a booking email.
 * Subset of `MappedAddOnLine` — only the fields needed for display.
 * Re-exported for use by the cancellation sender (shared shape avoids
 * the caller having to massage data twice).
 */
export interface AddOnEmailLine {
  name: string
  qty: number
  totalPrice: string
  currency: string
}

export interface BookingConfirmationData {
  to: string
  customerName: string
  confirmationCode: string
  tourTitle?: string
  bookingDate?: string
  startTime?: string
  participants?: number
  totalPrice: string
  currency: string
  /** Paid add-ons purchased at checkout. Omit/empty → no add-on block rendered. */
  addOns?: AddOnEmailLine[]
}

/**
 * Confirmation email sent to the customer after Bokun webhook
 * BOOKING_CREATED / BOOKING_CONFIRMED. Sent at most once per booking
 * (gated by `confirmationEmailSent` on the Booking row).
 */
export async function sendBookingConfirmationToCustomer(data: BookingConfirmationData) {
  const transporter = createEmailTransporter()
  const tourLine = data.tourTitle ? `<p><strong>Tour:</strong> ${escapeHtml(data.tourTitle)}</p>` : ''
  const dateLine =
    data.bookingDate || data.startTime
      ? `<p><strong>Date:</strong> ${escapeHtml(
          [data.bookingDate, data.startTime].filter(Boolean).join(' ') || '',
        )}</p>`
      : ''
  const peopleLine = data.participants
    ? `<p><strong>Participants:</strong> ${data.participants}</p>`
    : ''
  // Inline-style `<ul>` for Gmail/Outlook compatibility — list-style reset
  // and tight margins to keep the block visually compact.
  const addOnsBlock = data.addOns?.length
    ? `<p style="margin-bottom: 4px;"><strong>Add-ons:</strong></p>
       <ul style="margin: 0 0 12px 0; padding-left: 20px;">
         ${data.addOns
           .map(
             (a) =>
               `<li>${escapeHtml(a.name)} × ${a.qty} — ${escapeHtml(a.totalPrice)} ${escapeHtml(a.currency)}</li>`,
           )
           .join('')}
       </ul>`
    : ''

  await transporter.sendMail({
    from: getEmailFrom(),
    to: data.to,
    subject: `Booking confirmed — ${data.confirmationCode}`,
    html: `
      <h2>Thank you, ${escapeHtml(data.customerName || 'guest')}!</h2>
      <p>Your booking has been confirmed.</p>
      <p><strong>Confirmation code:</strong> ${escapeHtml(data.confirmationCode)}</p>
      ${tourLine}
      ${dateLine}
      ${peopleLine}
      ${addOnsBlock}
      <p><strong>Total:</strong> ${escapeHtml(data.totalPrice)} ${escapeHtml(data.currency)}</p>
      <p>We'll be in touch shortly before your tour with meeting-point details. Reply to this email if you need anything.</p>
      <p>Best regards,<br/>Private Tours Team</p>
    `,
  })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
