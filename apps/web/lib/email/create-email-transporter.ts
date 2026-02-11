import { createTransport } from 'nodemailer'

/**
 * Shared Nodemailer transporter using Gmail SMTP.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD env vars.
 */
export function createEmailTransporter() {
  return createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}
