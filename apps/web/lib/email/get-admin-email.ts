/**
 * Resolves the recipient address for admin notification emails (contact form,
 * group inquiries). Throws if unset so a missing configuration surfaces loudly
 * in logs/Sentry instead of silently sending to `undefined` — which is the
 * failure mode that caused admin notifications to never be delivered.
 */
export function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL
  if (!email) {
    throw new Error(
      'ADMIN_EMAIL env var is not set — admin notification email cannot be sent'
    )
  }
  return email
}
