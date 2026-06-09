import { createEmailTransporter } from './create-email-transporter'
import { getAdminEmail } from './get-admin-email'
import { getEmailFrom } from './get-email-from'

export interface ContactNotificationData {
  fullName: string
  email: string
  phone?: string
  subject: string
  message: string
}

/** Subject label mapping for admin notification email */
const subjectLabels: Record<string, string> = {
  general: 'General Inquiry',
  tour_booking: 'Tour Booking',
  group_inquiry: 'Group Inquiry',
  partnership: 'Partnership',
  other: 'Other',
}

/**
 * Send contact form notification email to admin.
 * Includes all form fields in an HTML table.
 */
export async function sendContactNotificationToAdmin(data: ContactNotificationData) {
  const transporter = createEmailTransporter()
  const subjectLabel = subjectLabels[data.subject] ?? data.subject

  await transporter.sendMail({
    from: getEmailFrom(),
    to: getAdminEmail(),
    subject: `New Contact: ${subjectLabel} — ${data.fullName}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Name</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(data.fullName)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
        ${data.phone ? `<tr><td style="padding:8px;border:1px solid #ddd"><strong>Phone</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(data.phone)}</td></tr>` : ''}
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Subject</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(subjectLabel)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd"><strong>Message</strong></td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(data.message)}</td></tr>
      </table>
      <hr style="margin:24px 0"/>
      <p><em>Reply directly to this email or contact the sender at ${escapeHtml(data.email)}.</em></p>
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
