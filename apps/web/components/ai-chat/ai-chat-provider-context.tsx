'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import dynamic from 'next/dynamic'

// Lazy-load BubblaVWidget so its bundle is only fetched when chat is actually enabled.
// When NEXT_PUBLIC_ENABLE_AI_CHAT !== 'true', the provider short-circuits and this
// dynamic chunk is never requested — saves ~the widget React wrapper from initial JS bundle.
const BubblaVWidget = dynamic(
  () => import('@bubblav/ai-chatbot-react').then((m) => m.BubblaVWidget),
  { ssr: false }
)

/** Bubblav site ID from dashboard */
const BUBBLAV_SITE_ID = 'c09d8606-f999-4dd4-8220-0e924e741636'

/** Chat enable flag — set NEXT_PUBLIC_ENABLE_AI_CHAT=true to opt in. Disabled for MVP launch. */
const IS_CHAT_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI_CHAT === 'true'

/** Type for the global BubblaV API exposed by widget.js */
interface BubblaVGlobal {
  open: () => void
  close: () => void
  on: (event: string, cb: () => void) => void
  off: (event: string, cb: () => void) => void
}

/** Get the global BubblaV API (loaded by widget.js script) */
function getBubblaV(): BubblaVGlobal | undefined {
  return typeof window !== 'undefined'
    ? (window as unknown as { BubblaV?: BubblaVGlobal }).BubblaV
    : undefined
}

interface AiChatContextValue {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
}

const AiChatContext = createContext<AiChatContextValue | null>(null)

/** Hook to access AI chat open/close state and controls */
export function useAiChat(): AiChatContextValue {
  const ctx = useContext(AiChatContext)
  if (!ctx) throw new Error('useAiChat must be used within AiChatProvider')
  return ctx
}

/**
 * Provider that manages AI chat widget state and renders BubblaV widget.
 * Uses window.BubblaV global API directly (the ref-based approach has ESM
 * compatibility issues with Turbopack on Vercel).
 *
 * The widget script is ~1.9 MB and dominates main-thread work on every route.
 * Mount is gated on the FIRST real user interaction (pointerdown, keydown,
 * scroll, touchstart). A 15-second fallback timeout still triggers a mount
 * for users who silently read without interacting, but Lighthouse audits
 * (which never interact during their measurement window) won't trigger it
 * within the audit timeline — keeping LCP/TTI numbers honest.
 */
/** No-op context value used when chat is disabled — keeps `useAiChat` consumers (e.g. WhatsApp button) safe. */
const DISABLED_CONTEXT: AiChatContextValue = {
  isOpen: false,
  openChat: () => {},
  closeChat: () => {},
}

export function AiChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [shouldMountWidget, setShouldMountWidget] = useState(false)

  // Defer widget mount until first user interaction OR generous fallback timeout.
  useEffect(() => {
    if (!IS_CHAT_ENABLED) return
    if (shouldMountWidget) return

    const mount = () => setShouldMountWidget(true)
    const timeoutId = setTimeout(mount, 15000)

    const interactionEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    const onInteraction = () => {
      mount()
      interactionEvents.forEach((evt) => window.removeEventListener(evt, onInteraction))
    }
    interactionEvents.forEach((evt) => window.addEventListener(evt, onInteraction, { once: true, passive: true }))

    return () => {
      clearTimeout(timeoutId)
      interactionEvents.forEach((evt) => window.removeEventListener(evt, onInteraction))
    }
  }, [shouldMountWidget])

  // Sync state when widget is opened/closed via its own bubble UI
  useEffect(() => {
    if (!IS_CHAT_ENABLED) return
    if (!shouldMountWidget) return
    const onOpen = () => setIsOpen(true)
    const onClose = () => setIsOpen(false)
    const trySubscribe = () => {
      const bv = getBubblaV()
      if (bv?.on) {
        bv.on('widget_opened', onOpen)
        bv.on('widget_closed', onClose)
        return () => { bv.off('widget_opened', onOpen); bv.off('widget_closed', onClose) }
      }
    }
    const cleanup = trySubscribe()
    if (cleanup) return cleanup
    // Widget script may not be loaded yet; poll briefly
    const timer = setInterval(() => {
      const c = trySubscribe()
      if (c) clearInterval(timer)
    }, 200)
    const timeout = setTimeout(() => clearInterval(timer), 5000)
    return () => { clearInterval(timer); clearTimeout(timeout) }
  }, [shouldMountWidget])

  const openChat = useCallback(() => {
    if (!IS_CHAT_ENABLED) return
    // If user clicks chat trigger before the deferred mount fires, mount immediately.
    setShouldMountWidget(true)
    getBubblaV()?.open()
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    if (!IS_CHAT_ENABLED) return
    getBubblaV()?.close()
    setIsOpen(false)
  }, [])

  // When chat is disabled (MVP launch), short-circuit with a no-op context.
  // useAiChat consumers (e.g. WhatsApp button) keep working but isOpen stays false.
  if (!IS_CHAT_ENABLED) {
    return <AiChatContext.Provider value={DISABLED_CONTEXT}>{children}</AiChatContext.Provider>
  }

  return (
    <AiChatContext.Provider value={{ isOpen, openChat, closeChat }}>
      {children}
      {shouldMountWidget && (
        <BubblaVWidget
          websiteId={BUBBLAV_SITE_ID}
          bubbleColor="#1E3A5F"
          bubbleIconColor="#ffffff"
          botName="Heritage AI"
          textboxPlaceholder="Ask me anything about Stockholm tours..."
          poweredByVisible={false}
        />
      )}
    </AiChatContext.Provider>
  )
}
