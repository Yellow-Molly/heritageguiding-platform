import { createEmailTransporter } from './create-email-transporter'

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
    from: `Private Tours <${process.env.GMAIL_USER}>`,
    to: data.to,
    subject: 'We received your message — Private Tours',
    html: `
      <h2>Thank you, ${escapeHtml(data.name)}!</h2>
      <p>We've received your message and appreciate you reaching out.</p>
      <p>Our team will review your inquiry and get back to you within <strong>24 hours</strong>.</p>
      <p>If your matter is urgent, you can reach us directly at <a href="mailto:info@privatetours.se">info@privatetours.se</a> or call <strong>+46 70 123 45 67</strong>.</p>
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
