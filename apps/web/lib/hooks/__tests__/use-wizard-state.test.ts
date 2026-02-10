import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWizardState } from '../use-wizard-state'
import * as wizardPrefs from '@/lib/storage/wizard-preferences'

describe('useWizardState', () => {
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

  describe('initial state', () => {
    it('starts at step 1 with empty arrays', () => {
      const { result } = renderHook(() => useWizardState())

      expect(result.current.step).toBe(1)
      expect(result.current.audience).toEqual([])
      expect(result.current.interests).toEqual([])
    })

    it('loads saved preferences but starts at step 1', () => {
      // Pre-populate localStorage
      localStorage.setItem(
        'hg-wizard-preferences',
        JSON.stringify({ audience: ['family_friendly'], interests: ['food_wine'] })
      )

      const { result } = renderHook(() => useWizardState())

      expect(result.current.step).toBe(1)
      expect(result.current.audience).toEqual(['family_friendly'])
      expect(result.current.interests).toEqual(['food_wine'])
    })

    it('handles missing saved preferences gracefully', () => {
      const { result } = renderHook(() => useWizardState())

      expect(result.current.step).toBe(1)
      expect(result.current.audience).toEqual([])
      expect(result.current.interests).toEqual([])
    })
  })

  describe('setAudience', () => {
    it('updates audience and advances to step 2', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setAudience(['family_friendly', 'couples'])
      })

      expect(result.current.audience).toEqual(['family_friendly', 'couples'])
      expect(result.current.step).toBe(2)
    })

    it('persists to localStorage', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setAudience(['history_nerds'])
      })

      const saved = localStorage.getItem('hg-wizard-preferences')
      expect(saved).toBeTruthy()
      const parsed = JSON.parse(saved!)
      expect(parsed.audience).toEqual(['history_nerds'])
    })

    it('preserves existing interests when updating audience', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setInterests(['food_wine'])
        result.current.setAudience(['couples'])
      })

      expect(result.current.audience).toEqual(['couples'])
      expect(result.current.interests).toEqual(['food_wine'])

      const saved = localStorage.getItem('hg-wizard-preferences')
      const parsed = JSON.parse(saved!)
      expect(parsed.interests).toEqual(['food_wine'])
    })

    it('handles empty array', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setAudience([])
      })

      expect(result.current.audience).toEqual([])
      expect(result.current.step).toBe(2)
    })

    it('can be called multiple times', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setAudience(['family_friendly'])
      })

      expect(result.current.audience).toEqual(['family_friendly'])

      act(() => {
        result.current.setAudience(['couples', 'corporate'])
      })

      expect(result.current.audience).toEqual(['couples', 'corporate'])
      expect(result.current.step).toBe(2)
    })
  })

  describe('setInterests', () => {
    it('updates interests and advances to step 3', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setInterests(['food_wine', 'architecture'])
      })

      expect(result.current.interests).toEqual(['food_wine', 'architecture'])
      expect(result.current.step).toBe(3)
    })

    it('persists to localStorage', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setInterests(['photography'])
      })

      const saved = localStorage.getItem('hg-wizard-preferences')
      expect(saved).toBeTruthy()
      const parsed = JSON.parse(saved!)
      expect(parsed.interests).toEqual(['photography'])
    })

    it('preserves existing audience when updating interests', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setAudience(['seniors'])
        result.current.setInterests(['art_lovers'])
      })

      expect(result.current.audience).toEqual(['seniors'])
      expect(result.current.interests).toEqual(['art_lovers'])

      const saved = localStorage.getItem('hg-wizard-preferences')
      const parsed = JSON.parse(saved!)
      expect(parsed.audience).toEqual(['seniors'])
    })

    it('handles empty array', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setInterests([])
      })

      expect(result.current.interests).toEqual([])
      expect(result.current.step).toBe(3)
    })
  })

  describe('goBack', () => {
    it('decrements step from 2 to 1', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setAudience(['family_friendly'])
      })

      expect(result.current.step).toBe(2)

      act(() => {
        result.current.goBack()
      })

      expect(result.current.step).toBe(1)
    })

    it('decrements step from 3 to 2', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setAudience(['couples'])
        result.current.setInterests(['food_wine'])
      })

      expect(result.current.step).toBe(3)

      act(() => {
        result.current.goBack()
      })

      expect(result.current.step).toBe(2)
    })

    it('does not go below step 1', () => {
      const { result } = renderHook(() => useWizardState())

      expect(result.current.step).toBe(1)

      act(() => {
        result.current.goBack()
      })

      expect(result.current.step).toBe(1)
    })

    it('preserves audience and interests when going back', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setAudience(['corporate'])
        result.current.setInterests(['architecture'])
        result.current.goBack()
      })

      expect(result.current.audience).toEqual(['corporate'])
      expect(result.current.interests).toEqual(['architecture'])
    })
  })

  describe('reset', () => {
    it('clears all state and returns to step 1', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setAudience(['family_friendly'])
        result.current.setInterests(['food_wine'])
      })

      expect(result.current.step).toBe(3)
      expect(result.current.audience).toEqual(['family_friendly'])
      expect(result.current.interests).toEqual(['food_wine'])

      act(() => {
        result.current.reset()
      })

      expect(result.current.step).toBe(1)
      expect(result.current.audience).toEqual([])
      expect(result.current.interests).toEqual([])
    })

    it('removes preferences from localStorage', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setAudience(['couples'])
      })

      expect(localStorage.getItem('hg-wizard-preferences')).toBeTruthy()

      act(() => {
        result.current.reset()
      })

      expect(localStorage.getItem('hg-wizard-preferences')).toBeNull()
    })

    it('can be called multiple times safely', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.reset()
        result.current.reset()
      })

      expect(result.current.step).toBe(1)
      expect(result.current.audience).toEqual([])
      expect(result.current.interests).toEqual([])
    })
  })

  describe('localStorage persistence', () => {
    it('persists complete workflow', () => {
      const { result } = renderHook(() => useWizardState())

      act(() => {
        result.current.setAudience(['family_friendly', 'couples'])
      })

      let saved = localStorage.getItem('hg-wizard-preferences')
      expect(JSON.parse(saved!)).toEqual({
        audience: ['family_friendly', 'couples'],
        interests: [],
      })

      act(() => {
        result.current.setInterests(['food_wine', 'architecture'])
      })

      saved = localStorage.getItem('hg-wizard-preferences')
      expect(JSON.parse(saved!)).toEqual({
        audience: ['family_friendly', 'couples'],
        interests: ['food_wine', 'architecture'],
      })
    })
  })
})
