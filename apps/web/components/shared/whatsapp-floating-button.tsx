'use client'

import { useState, useSyncExternalStore } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { X, MessageCircle } from 'lucide-react'

interface WhatsAppFloatingButtonProps {
  phoneNumber: string
}

/** Localized default messages for WhatsApp deep link */
const LOCALIZED_MESSAGES: Record<string, string> = {
  sv: 'Hej! Jag är intresserad av era guidade turer i Stockholm.',
  en: 'Hello! I am interested in your guided tours in Stockholm.',
  de: 'Hallo! Ich interessiere mich für Ihre Führungen in Stockholm.',
}

const DISMISS_KEY = 'hg-whatsapp-dismissed'

/** Read dismissed state from localStorage without useEffect */
function subscribeToDismiss(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}
function getDismissedSnapshot() {
  return localStorage.getItem(DISMISS_KEY) === 'true'
}
function getDismissedServerSnapshot() {
  return true // Hidden during SSR to avoid hydration mismatch
}

/**
 * Floating WhatsApp button (bottom-right).
 * Uses wa.me deep links (free, no Business API).
 * Dismissable with localStorage persistence.
 * Mobile opens native WhatsApp app; desktop opens WhatsApp Web.
 */
export function WhatsAppFloatingButton({ phoneNumber }: WhatsAppFloatingButtonProps) {
  const locale = useLocale()
  const t = useTranslations('whatsapp')
  const storedDismissed = useSyncExternalStore(subscribeToDismiss, getDismissedSnapshot, getDismissedServerSnapshot)
  const [localDismissed, setLocalDismissed] = useState(false)
  const dismissed = storedDismissed || localDismissed

  if (!phoneNumber || dismissed) return null

  const message = encodeURIComponent(LOCALIZED_MESSAGES[locale] || LOCALIZED_MESSAGES.en)
  const waLink = `https://wa.me/${phoneNumber}?text=${message}`

  function handleDismiss() {
    setLocalDismissed(true)
    localStorage.setItem(DISMISS_KEY, 'true')
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Tooltip / prompt */}
      <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow-lg border border-[var(--color-border)]">
        <span className="text-sm font-medium">{t('prompt')}</span>
        <button
          onClick={handleDismiss}
          className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-surface)] transition-colors"
          aria-label={t('dismiss')}
        >
          <X className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
        </button>
      </div>

      {/* WhatsApp button */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2"
        aria-label={t('chatOnWhatsApp')}
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  )
}
