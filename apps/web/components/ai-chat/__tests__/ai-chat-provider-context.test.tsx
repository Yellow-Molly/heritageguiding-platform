import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AiChatProvider, useAiChat } from '../ai-chat-provider-context'

// Mock the BubblaV package
vi.mock('@bubblav/ai-chatbot-react', () => ({
  BubblaVWidget: vi.fn(() => null),
  useBubblaVEvent: vi.fn(),
}))

describe('AiChatProvider', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AiChatProvider>{children}</AiChatProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAiChat hook', () => {
    it('should throw when useAiChat used outside provider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => renderHook(() => useAiChat())).toThrow('useAiChat must be used within AiChatProvider')
      spy.mockRestore()
    })

    it('should default isOpen to false', () => {
      const { result } = renderHook(() => useAiChat(), { wrapper })
      expect(result.current.isOpen).toBe(false)
    })

    it('should set isOpen to true when openChat called', () => {
      const { result } = renderHook(() => useAiChat(), { wrapper })
      act(() => result.current.openChat())
      expect(result.current.isOpen).toBe(true)
    })

    it('should set isOpen to false when closeChat called', () => {
      const { result } = renderHook(() => useAiChat(), { wrapper })
      act(() => result.current.openChat())
      expect(result.current.isOpen).toBe(true)
      act(() => result.current.closeChat())
      expect(result.current.isOpen).toBe(false)
    })

    it('should toggle between open and close states', () => {
      const { result } = renderHook(() => useAiChat(), { wrapper })
      expect(result.current.isOpen).toBe(false)

      act(() => result.current.openChat())
      expect(result.current.isOpen).toBe(true)

      act(() => result.current.closeChat())
      expect(result.current.isOpen).toBe(false)

      act(() => result.current.openChat())
      expect(result.current.isOpen).toBe(true)
    })


    it('openChat should be callable multiple times idempotently', () => {
      const { result } = renderHook(() => useAiChat(), { wrapper })

      act(() => result.current.openChat())
      expect(result.current.isOpen).toBe(true)

      act(() => result.current.openChat())
      expect(result.current.isOpen).toBe(true)
    })

    it('closeChat should be callable multiple times idempotently', () => {
      const { result } = renderHook(() => useAiChat(), { wrapper })

      act(() => result.current.closeChat())
      expect(result.current.isOpen).toBe(false)

      act(() => result.current.closeChat())
      expect(result.current.isOpen).toBe(false)
    })
  })

  describe('AiChatProvider context value', () => {
    it('should provide all required context properties', () => {
      const { result } = renderHook(() => useAiChat(), { wrapper })
      expect(result.current).toHaveProperty('isOpen')
      expect(result.current).toHaveProperty('openChat')
      expect(result.current).toHaveProperty('closeChat')
    })

    it('openChat and closeChat should be functions', () => {
      const { result } = renderHook(() => useAiChat(), { wrapper })
      expect(typeof result.current.openChat).toBe('function')
      expect(typeof result.current.closeChat).toBe('function')
    })

    it('isOpen should be a boolean', () => {
      const { result } = renderHook(() => useAiChat(), { wrapper })
      expect(typeof result.current.isOpen).toBe('boolean')
    })
  })
})
