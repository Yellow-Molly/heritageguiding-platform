import { unstable_cache } from 'next/cache'

/**
 * Fetch WhatsApp phone number from Payload CMS site-settings global.
 * Falls back to WHATSAPP_NUMBER env var if CMS is unavailable.
 * Cached for 5 minutes to avoid excessive DB queries.
 */
export const getWhatsAppNumber = unstable_cache(
  async (): Promise<string | null> => {
    try {
      const { getPayload } = await import('payload')
      const config = (await import('@payload-config')).default
      const payload = await getPayload({ config })
      const settings = await payload.findGlobal({ slug: 'site-settings' })
      return (settings?.whatsappNumber as string) || process.env.WHATSAPP_NUMBER || null
    } catch {
      // CMS unavailable (e.g., build time, no DB) - fall back to env var
      return process.env.WHATSAPP_NUMBER || null
    }
  },
  ['whatsapp-number'],
  { revalidate: 300 } // 5 minutes
)
