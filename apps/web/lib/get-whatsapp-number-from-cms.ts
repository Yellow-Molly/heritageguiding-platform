/**
 * Fetch WhatsApp phone number from Payload CMS site-settings global.
 * Falls back to WHATSAPP_NUMBER env var if CMS is unavailable.
 */
export async function getWhatsAppNumber(): Promise<string | null> {
  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })
    // @ts-expect-error - site-settings global is defined in CMS config at runtime
    const settingsData = await payload.findGlobal({ slug: 'site-settings' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whatsappNumberValue = (settingsData as any)?.whatsappNumber
    if (typeof whatsappNumberValue === 'string') {
      return whatsappNumberValue
    }
    return process.env.WHATSAPP_NUMBER || null
  } catch {
    // CMS unavailable (e.g., build time, no DB) - fall back to env var
    return process.env.WHATSAPP_NUMBER || null
  }
}
