'use client'

/**
 * State management hook for the Concierge Wizard.
 * Tracks current step, audience/interest selections, and persists to localStorage.
 */

import { useState, useCallback } from 'react'
import {
  saveWizardPreferences,
  getWizardPreferences,
} from '@/lib/storage/wizard-preferences'

interface WizardState {
  step: number
  audience: string[]
  interests: string[]
}

export function useWizardState() {
  const [state, setState] = useState<WizardState>(() => {
    const saved = getWizardPreferences()
    // Start at step 1 even if preferences are saved (user can see fresh wizard)
    return { step: 1, audience: saved?.audience ?? [], interests: saved?.interests ?? [] }
  })

  const setAudience = useCallback((audience: string[]) => {
    setState((prev) => {
      const next = { ...prev, audience, step: 2 }
      saveWizardPreferences({ audience, interests: prev.interests })
      return next
    })
  }, [])

  const setInterests = useCallback((interests: string[]) => {
    setState((prev) => {
      const next = { ...prev, interests, step: 3 }
      saveWizardPreferences({ audience: prev.audience, interests })
      return next
    })
  }, [])

  const goBack = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }))
  }, [])

  const reset = useCallback(() => {
    setState({ step: 1, audience: [], interests: [] })
    saveWizardPreferences(null)
  }, [])

  return { ...state, setAudience, setInterests, goBack, reset }
}
