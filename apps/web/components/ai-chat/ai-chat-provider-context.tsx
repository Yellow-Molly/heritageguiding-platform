'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import { BubblaVWidget } from '@bubblav/ai-chatbot-react'

/** Bubblav site ID from dashboard */
const BUBBLAV_SITE_ID = 'c09d8606-f999-4dd4-8220-0e924e741636'

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
 */
export function AiChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  // Sync state when widget is opened/closed via its own bubble UI
  useEffect(() => {
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
  }, [])

  const openChat = useCallback(() => {
    getBubblaV()?.open()
    setIsOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    getBubblaV()?.close()
    setIsOpen(false)
  }, [])

  return (
    <AiChatContext.Provider value={{ isOpen, openChat, closeChat }}>
      {children}
      <BubblaVWidget
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
