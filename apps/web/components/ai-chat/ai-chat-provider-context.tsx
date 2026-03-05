'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { BubblaVWidget, type BubblaVWidgetRef } from '@bubblav/ai-chatbot-react'

/** Bubblav site ID from dashboard */
const BUBBLAV_SITE_ID = 'c09d8606-f999-4dd4-8220-0e924e741636'

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
 * The widget bubble is always visible (bottom-left to avoid WhatsApp conflict).
 * "Ask AI" buttons throughout the site also open the widget via openChat().
 */
export function AiChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const widgetRef = useRef<BubblaVWidgetRef>(null)

  // Sync state when widget is opened/closed via its own bubble UI
  // Note: useBubblaVEvent not available in ESM bundle, use window.BubblaV directly
  useEffect(() => {
    const onOpen = () => setIsOpen(true)
    const onClose = () => setIsOpen(false)
    const trySubscribe = () => {
      const bv = typeof window !== 'undefined' ? (window as Record<string, unknown>).BubblaV as { on?: (e: string, cb: () => void) => void; off?: (e: string, cb: () => void) => void } | undefined : undefined
      if (bv?.on) {
        bv.on('widget_opened', onOpen)
        bv.on('widget_closed', onClose)
        return () => { bv.off?.('widget_opened', onOpen); bv.off?.('widget_closed', onClose) }
      }
    }
    const cleanup = trySubscribe()
    if (cleanup) return cleanup
    // Widget script may not be loaded yet; poll briefly
    const timer = setInterval(() => {
      const c = trySubscribe()
      if (c) { clearInterval(timer); }
    }, 200)
    const timeout = setTimeout(() => clearInterval(timer), 5000)
    return () => { clearInterval(timer); clearTimeout(timeout) }
  }, [])

  const openChat = useCallback(() => {
    widgetRef.current?.open()
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    widgetRef.current?.close()
    setIsOpen(false)
  }, [])

  return (
    <AiChatContext.Provider value={{ isOpen, openChat, closeChat }}>
      {children}
      <BubblaVWidget
        ref={widgetRef}
        websiteId={BUBBLAV_SITE_ID}
        bubbleColor="#1E3A5F"
        bubbleIconColor="#ffffff"
        botName="Heritage AI"
        textboxPlaceholder="Ask me anything about Stockholm tours..."
        poweredByVisible={false}
      />
    </AiChatContext.Provider>
  )
}
