import { CONTACT_EMAIL, CONTACT_PHONE } from '@/lib/contact-constants'
import { createEmailTransporter } from './create-email-transporter'
import { getEmailFrom } from './get-email-from'

export interface ContactConfirmationData {
  to: string
  name: string
}

/**
 * Send confirmation email to customer after contact form submission.
 */
export async function sendContactConfirmationToCustomer(data: ContactConfirmationData) {
  const transporter = createEmailTransporter()

  await transporter.sendMail({
    from: getEmailFrom(),
    to: data.to,
    subject: 'We received your message — Private Tours',
    html: `
      <h2>Thank you, ${escapeHtml(data.name)}!</h2>
      <p>We've received your message and appreciate you reaching out.</p>
      <p>Our team will review your inquiry and get back to you within <strong>24 hours</strong>.</p>
      <p>If your matter is urgent, you can reach us directly at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> or call <strong>${CONTACT_PHONE}</strong>.</p>
      <p>Best regards,<br/>Private Tours Team</p>
    `,
  })
}

/** Escape HTML special characters to prevent injection in emails */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
