import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  saveWizardPreferences,
  getWizardPreferences,
  type WizardPreferences,
} from '../wizard-preferences'

describe('wizard-preferences', () => {
  // Mock localStorage
  const localStorageMock: Storage = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
      key: () => null,
      length: 0,
    }
  })()

  beforeEach(() => {
    // Reset localStorage before each test
    localStorageMock.clear()
    Object.defineProperty(globalThis, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: localStorageMock },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    localStorageMock.clear()
    vi.restoreAllMocks()
  })

  describe('saveWizardPreferences', () => {
    it('saves preferences to localStorage', () => {
      const prefs: WizardPreferences = {
        audience: ['family_friendly', 'couples'],
        interests: ['food_wine', 'architecture'],
      }

      saveWizardPreferences(prefs)

      const saved = localStorage.getItem('hg-wizard-preferences')
      expect(saved).toBeTruthy()
      expect(JSON.parse(saved!)).toEqual(prefs)
    })

    it('removes preferences when passed null', () => {
      // First save something
      localStorage.setItem('hg-wizard-preferences', JSON.stringify({ audience: [], interests: [] }))

      saveWizardPreferences(null)

      expect(localStorage.getItem('hg-wizard-preferences')).toBeNull()
    })

    it('handles empty arrays', () => {
      const prefs: WizardPreferences = {
        audience: [],
        interests: [],
      }

      saveWizardPreferences(prefs)

      const saved = localStorage.getItem('hg-wizard-preferences')
      expect(JSON.parse(saved!)).toEqual(prefs)
    })

    it('is SSR-safe when window is undefined', () => {
      // Temporarily remove window
      const originalWindow = globalThis.window
      // @ts-expect-error - Testing SSR scenario
      delete globalThis.window

      expect(() => saveWizardPreferences({ audience: [], interests: [] })).not.toThrow()

      // Restore window
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      })
    })

    it('fails silently when localStorage throws', () => {
      // Mock localStorage to throw
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      expect(() => saveWizardPreferences({ audience: [], interests: [] })).not.toThrow()
    })
  })

  describe('getWizardPreferences', () => {
    it('retrieves saved preferences', () => {
      const prefs: WizardPreferences = {
        audience: ['history_nerds', 'art_lovers'],
        interests: ['photography', 'architecture'],
      }

      localStorage.setItem('hg-wizard-preferences', JSON.stringify(prefs))

      const retrieved = getWizardPreferences()
      expect(retrieved).toEqual(prefs)
    })

    it('returns null when no preferences are saved', () => {
      expect(getWizardPreferences()).toBeNull()
    })

    it('returns null for invalid JSON', () => {
      localStorage.setItem('hg-wizard-preferences', '{invalid-json')

      expect(getWizardPreferences()).toBeNull()
    })

    it('validates shape before returning - rejects missing audience', () => {
      localStorage.setItem('hg-wizard-preferences', JSON.stringify({ interests: [] }))

      expect(getWizardPreferences()).toBeNull()
    })

    it('validates shape before returning - rejects missing interests', () => {
      localStorage.setItem('hg-wizard-preferences', JSON.stringify({ audience: [] }))

      expect(getWizardPreferences()).toBeNull()
    })

    it('validates shape before returning - rejects non-array audience', () => {
      localStorage.setItem('hg-wizard-preferences', JSON.stringify({ audience: 'not-array', interests: [] }))

      expect(getWizardPreferences()).toBeNull()
    })

    it('validates shape before returning - rejects non-array interests', () => {
      localStorage.setItem('hg-wizard-preferences', JSON.stringify({ audience: [], interests: 'not-array' }))

      expect(getWizardPreferences()).toBeNull()
    })

    it('is SSR-safe when window is undefined', () => {
      // Temporarily remove window
      const originalWindow = globalThis.window
      // @ts-expect-error - Testing SSR scenario
      delete globalThis.window

      expect(getWizardPreferences()).toBeNull()

      // Restore window
      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      })
    })

    it('recovers from corrupt localStorage', () => {
      localStorage.setItem('hg-wizard-preferences', 'null')

      expect(getWizardPreferences()).toBeNull()
    })

    it('handles complex nested arrays', () => {
      const prefs: WizardPreferences = {
        audience: ['family_friendly', 'couples', 'corporate'],
        interests: ['food_wine', 'adventure', 'architecture', 'history_nerds'],
      }

      localStorage.setItem('hg-wizard-preferences', JSON.stringify(prefs))

      expect(getWizardPreferences()).toEqual(prefs)
    })
  })
})
