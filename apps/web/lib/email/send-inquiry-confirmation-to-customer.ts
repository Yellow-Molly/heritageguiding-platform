import { createEmailTransporter } from './create-email-transporter'

export interface InquiryConfirmationData {
  to: string
  name: string
  groupSize: number
}

/**
 * Send confirmation email to customer after group inquiry submission.
 */
export async function sendInquiryConfirmationToCustomer(data: InquiryConfirmationData) {
  const transporter = createEmailTransporter()

  await transporter.sendMail({
    from: `Private Tours <${process.env.GMAIL_USER}>`,
    to: data.to,
    subject: 'We received your group booking inquiry',
    html: `
      <h2>Thank you, ${escapeHtml(data.name)}!</h2>
      <p>We've received your inquiry for a group of <strong>${data.groupSize}</strong> people.</p>
      <p>Our team will review your request and contact you within 24 hours with a custom quote.</p>
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
