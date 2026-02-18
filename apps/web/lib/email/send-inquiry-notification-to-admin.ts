import { createEmailTransporter } from './create-email-transporter'

export interface InquiryNotificationData {
  name: string
  email: string
  phone: string
  groupSize: number
  preferredDates: string
  tourInterest?: string
  specialRequirements?: string
}

/**
 * Send group inquiry notification email to admin.
 * Includes all inquiry details and Bokun follow-up instructions.
 */
export async function sendInquiryNotificationToAdmin(data: InquiryNotificationData) {
  const transporter = createEmailTransporter()

  await transporter.sendMail({
    from: `Private Tours <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL!,
    subject: `New Group Inquiry: ${data.groupSize} people - ${data.name}`,
    html: `
      <h2>New Group Booking Inquiry</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Name</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(data.name)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Phone</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(data.phone)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Group Size</strong></td><td style="padding:8px;border:1px solid #ddd">${data.groupSize} people</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Preferred Dates</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(data.preferredDates)}</td></tr>
        ${data.tourInterest ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Tour Interest</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(data.tourInterest)}</td></tr>` : ''}
        ${data.specialRequirements ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Special Requirements</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(data.specialRequirements)}</td></tr>` : ''}
      </table>
      <hr style="margin:24px 0"/>
      <p><em>Next step: Create a custom quote and booking in Bokun dashboard for this group.</em></p>
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
