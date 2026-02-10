'use client'

/**
 * Main Concierge Wizard container component.
 * Orchestrates the 3-step wizard flow: Audience -> Interests -> Results.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useWizardState } from '@/lib/hooks/use-wizard-state'
import { WizardProgressIndicator } from './wizard-progress-indicator'
import { WizardStepSelector } from './wizard-step-selector'
import { WizardTourResults } from './wizard-tour-results'
import { Button } from '@/components/ui/button'
import type { FeaturedTour } from '@/lib/api/get-featured-tours'

/** Audience options for Step 1 - maps to targetAudience field values */
const AUDIENCE_OPTIONS = [
  { value: 'family_friendly', emoji: '\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}\u{200D}\u{1F466}', labelKey: 'family' },
  { value: 'couples', emoji: '\u{1F491}', labelKey: 'couples' },
  { value: 'corporate', emoji: '\u{1F3E2}', labelKey: 'corporate' },
  { value: 'seniors', emoji: '\u{1F9D3}', labelKey: 'seniors' },
  { value: 'solo_travelers', emoji: '\u{1F4DA}', labelKey: 'solo' },
] as const

/** Interest options for Step 2 - maps to targetAudience field values */
const INTEREST_OPTIONS = [
  { value: 'history_nerds', emoji: '\u{1F3DB}\u{FE0F}', labelKey: 'history' },
  { value: 'art_lovers', emoji: '\u{1F3A8}', labelKey: 'art' },
  { value: 'food_wine', emoji: '\u{1F377}', labelKey: 'foodWine' },
  { value: 'photography', emoji: '\u{1F4F8}', labelKey: 'photography' },
  { value: 'adventure', emoji: '\u{26A1}', labelKey: 'adventure' },
  { value: 'architecture', emoji: '\u{1F3F0}', labelKey: 'architecture' },
] as const

export function ConciergeWizardContainer() {
  const t = useTranslations('wizard')
  const { step, audience, interests, setAudience, setInterests, goBack, reset } = useWizardState()
  const [tours, setTours] = useState<FeaturedTour[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  /** Fetch tour recommendations from API - called on step 3 entry */
  const fetchRecommendations = useCallback((audienceTags: string[], interestTags: string[]) => {
    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    fetch('/api/tours/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audience: audienceTags, interests: interestTags }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => setTours(data))
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch recommendations:', err)
          setTours([])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  return (
    <section className="py-12">
      <div className="container mx-auto max-w-3xl px-4">
        <WizardProgressIndicator currentStep={step} totalSteps={3} />

        {/* Step 1: Who are you? */}
        {step === 1 && (
          <WizardStepSelector
            title={t('step1.title')}
            subtitle={t('step1.subtitle')}
            options={AUDIENCE_OPTIONS.map((opt) => ({
              ...opt,
              label: t(`audience.${opt.labelKey}`),
            }))}
            onSelect={(values) => setAudience(values)}
          />
        )}

        {/* Step 2: What interests you? */}
        {step === 2 && (
          <>
            <WizardStepSelector
              title={t('step2.title')}
              subtitle={t('step2.subtitle')}
              options={INTEREST_OPTIONS.map((opt) => ({
                ...opt,
                label: t(`interests.${opt.labelKey}`),
              }))}
              onSelect={(values) => {
                setInterests(values)
                fetchRecommendations(audience, values)
              }}
              allowMultiple
              initialSelected={interests}
            />
            <div className="mt-6 flex justify-start">
              <Button variant="ghost" onClick={goBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                {t('back')}
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <>
            <WizardTourResults tours={tours} loading={loading} />
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={goBack} leftIcon={<ArrowLeft className="h-4 w-4" />}>
                {t('back')}
              </Button>
              <Button variant="outline-dark" onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" />}>
                {t('startOver')}
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
