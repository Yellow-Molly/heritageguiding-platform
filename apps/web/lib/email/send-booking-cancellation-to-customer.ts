import { createEmailTransporter } from './create-email-transporter'
import { getEmailFrom } from './get-email-from'
import type { AddOnEmailLine } from './send-booking-confirmation-to-customer'

export interface BookingCancellationData {
  to: string
  customerName: string
  confirmationCode: string
  tourTitle?: string
  bookingDate?: string
  /** Paid add-ons that were on the cancelled booking. Refund flow is Bokun's; this is courtesy context. */
  addOns?: AddOnEmailLine[]
}

/**
 * Cancellation notice sent to the customer after Bokun webhook
 * BOOKING_CANCELLED. Bokun handles the refund flow itself; this email
 * is just a courtesy acknowledgement so the customer knows we received
 * the cancellation on our side too.
 */
export async function sendBookingCancellationToCustomer(data: BookingCancellationData) {
  const transporter = createEmailTransporter()
  const tourLine = data.tourTitle ? `<p><strong>Tour:</strong> ${escapeHtml(data.tourTitle)}</p>` : ''
  const dateLine = data.bookingDate
    ? `<p><strong>Originally scheduled:</strong> ${escapeHtml(data.bookingDate)}</p>`
    : ''
  // Single comma-separated summary line — cancellation emails stay terse.
  const addOnsLine = data.addOns?.length
    ? `<p><strong>Add-ons included:</strong> ${data.addOns
        .map((a) => `${escapeHtml(a.name)} × ${a.qty}`)
        .join(', ')}</p>`
    : ''

  await transporter.sendMail({
    from: getEmailFrom(),
    to: data.to,
    subject: `Booking cancelled — ${data.confirmationCode}`,
    html: `
      <h2>Hi ${escapeHtml(data.customerName || 'there')},</h2>
      <p>Your booking has been cancelled.</p>
      <p><strong>Confirmation code:</strong> ${escapeHtml(data.confirmationCode)}</p>
      ${tourLine}
      ${dateLine}
      ${addOnsLine}
      <p>If a refund applies, it's processed through Bokun and will arrive via your original payment method within the standard window for your bank.</p>
      <p>We hope to host you on another tour soon — reply to this email if you'd like help picking a new date.</p>
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
