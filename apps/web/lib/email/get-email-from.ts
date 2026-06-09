/**
 * Builds the From header for outbound mail. SMTP still authenticates as
 * GMAIL_USER (the licensed Google Workspace account); EMAIL_FROM overrides only
 * the visible sender, so mail can appear to come from a Workspace alias such as
 * bookings@privatetours.se while authentication stays on the primary account.
 * Falls back to GMAIL_USER when EMAIL_FROM is unset (preserves prior behaviour).
 */
export function getEmailFrom(): string {
  const address = process.env.EMAIL_FROM || process.env.GMAIL_USER
  return `Private Tours <${address}>`
}
