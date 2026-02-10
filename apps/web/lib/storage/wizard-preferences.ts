/**
 * localStorage helper for Concierge Wizard preferences.
 * Persists user selections for returning visitors.
 */

const STORAGE_KEY = 'hg-wizard-preferences'

export interface WizardPreferences {
  audience: string[]
  interests: string[]
}

/** Save wizard preferences to localStorage */
export function saveWizardPreferences(prefs: WizardPreferences | null): void {
  if (typeof window === 'undefined') return
  try {
    if (prefs === null) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    }
  } catch {
    // localStorage might be full or disabled - fail silently
  }
}

/** Retrieve wizard preferences from localStorage */
export function getWizardPreferences(): WizardPreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    // Validate shape before returning
    if (Array.isArray(parsed?.audience) && Array.isArray(parsed?.interests)) {
      return { audience: parsed.audience, interests: parsed.interests }
    }
    return null
  } catch {
    return null
  }
}
