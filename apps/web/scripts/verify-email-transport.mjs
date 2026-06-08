#!/usr/bin/env node
/**
 * Smoke-tests the Gmail SMTP transporter credentials used by lib/email/*.
 * Run before relying on contact/group-inquiry email delivery in an environment.
 *
 * Usage:
 *   GMAIL_USER=... GMAIL_APP_PASSWORD=... node apps/web/scripts/verify-email-transport.mjs [recipient]
 *
 * - Verifies the SMTP connection/auth (transporter.verify()).
 * - If a recipient arg (or ADMIN_EMAIL) is present, also sends one test email.
 */
import { createTransport } from 'nodemailer'

const { GMAIL_USER, GMAIL_APP_PASSWORD, ADMIN_EMAIL } = process.env

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error('✗ Missing GMAIL_USER or GMAIL_APP_PASSWORD in environment')
  process.exit(1)
}

const transporter = createTransport({
  service: 'gmail',
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
})

try {
  await transporter.verify()
  console.log(`✓ SMTP connection + auth verified for ${GMAIL_USER}`)
} catch (err) {
  console.error('✗ SMTP verification failed:', err.message)
  process.exit(1)
}

const recipient = process.argv[2] || ADMIN_EMAIL
if (!recipient) {
  console.log('ℹ No recipient given and ADMIN_EMAIL unset — skipped test send. Pass an address to send a test email.')
  process.exit(0)
}

try {
  const info = await transporter.sendMail({
    from: `Private Tours <${GMAIL_USER}>`,
    to: recipient,
    subject: 'Private Tours — email transport test',
    text: 'If you received this, the Gmail SMTP transport is working correctly.',
  })
  console.log(`✓ Test email sent to ${recipient} (messageId: ${info.messageId})`)
} catch (err) {
  console.error(`✗ Failed to send test email to ${recipient}:`, err.message)
  process.exit(1)
}
