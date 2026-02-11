import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next-intl hooks
vi.mock('next-intl', () => ({
  useLocale: vi.fn().mockReturnValue('en'),
  useTranslations: vi.fn().mockReturnValue((key: string) => {
    const translations: Record<string, string> = {
      prompt: 'Questions? Chat with us!',
      chatOnWhatsApp: 'Chat on WhatsApp',
      dismiss: 'Dismiss',
    }
    return translations[key] || key
  }),
}))

import { WhatsAppFloatingButton } from '../whatsapp-floating-button'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: () => {
      store = {}
    },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('WhatsAppFloatingButton', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('renders nothing when no phone number provided', () => {
    const { container } = render(<WhatsAppFloatingButton phoneNumber="" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders WhatsApp link with correct wa.me URL', () => {
    render(<WhatsAppFloatingButton phoneNumber="46701234567" />)
    const link = screen.getByRole('link', { name: 'Chat on WhatsApp' })
    expect(link).toHaveAttribute('href', expect.stringContaining('https://wa.me/46701234567'))
  })

  it('includes localized message in URL', () => {
    render(<WhatsAppFloatingButton phoneNumber="46701234567" />)
    const link = screen.getByRole('link', { name: 'Chat on WhatsApp' })
    const href = link.getAttribute('href')!
    expect(href).toContain('text=')
    expect(href).toContain(encodeURIComponent('Hello!'))
  })

  it('opens in new tab', () => {
    render(<WhatsAppFloatingButton phoneNumber="46701234567" />)
    const link = screen.getByRole('link', { name: 'Chat on WhatsApp' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders dismiss button', () => {
    render(<WhatsAppFloatingButton phoneNumber="46701234567" />)
    expect(screen.getByLabelText('Dismiss')).toBeInTheDocument()
  })

  it('hides component and persists to localStorage on dismiss', () => {
    render(<WhatsAppFloatingButton phoneNumber="46701234567" />)
    const dismissBtn = screen.getByLabelText('Dismiss')
    fireEvent.click(dismissBtn)

    expect(localStorageMock.setItem).toHaveBeenCalledWith('hg-whatsapp-dismissed', 'true')
    expect(screen.queryByRole('link', { name: 'Chat on WhatsApp' })).not.toBeInTheDocument()
  })

  it('stays hidden if previously dismissed', () => {
    // Set persistent value in store (useSyncExternalStore reads snapshot multiple times)
    localStorageMock.setItem('hg-whatsapp-dismissed', 'true')
    render(<WhatsAppFloatingButton phoneNumber="46701234567" />)
    expect(screen.queryByRole('link', { name: 'Chat on WhatsApp' })).not.toBeInTheDocument()
  })

  it('renders prompt text', () => {
    render(<WhatsAppFloatingButton phoneNumber="46701234567" />)
    expect(screen.getByText('Questions? Chat with us!')).toBeInTheDocument()
  })
})
