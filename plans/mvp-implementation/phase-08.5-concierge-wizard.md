# Phase 08.5: Concierge Wizard

## Context Links

- [MVP Project Plan v1.2](../../docs/MVP-PROJECT-PLAN.md)
- [Data Models](./phase-03-data-models-cms-schema.md) - audience tags
- [Homepage](./phase-05-homepage.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | complete | 8-12h |

AI-powered tour recommendation wizard on **dedicated /find-tour page** using audience tags. Multi-step wizard: "Who are you?" → "What interests you?" → Personalized tour recommendations. *(Validated: Separate page, not homepage - allows A/B testing and cleaner homepage)*

## Key Insights

- Uses `targetAudience` multi-select field from Tours collection
- Three-step wizard flow with smooth transitions
- Smart filtering based on user selections
- Mobile-friendly interface
- Available in SV/EN/DE
- Saves preferences to localStorage for returning visitors

## Requirements

### Functional
- Multi-step wizard interface
- Step 1: "Who are you?" (audience selection)
  - Family with children
  - Couple's getaway
  - Corporate/Team building
  - Senior travelers
  - Solo history enthusiast
- Step 2: "What interests you?" (category selection)
  - History & Heritage
  - Art & Culture
  - Food & Wine
  - Photography
  - Adventure
- Step 3: Results (personalized tour recommendations)
- Mobile-friendly interface
- Available in all 3 languages
- Go back functionality
- Results show matching relevance

### Non-Functional
- Smooth animations between steps
- Progress indicator
- Fast API response (< 500ms)
- Save preferences to localStorage
- Accessible (keyboard navigation)

## Architecture

### Wizard Flow

```
Step 1: "Who are you traveling with?"
├── 👨‍👩‍👧‍👦 Family with children → family_friendly
├── 💑 Couple's getaway → couples
├── 🏢 Corporate/Team building → corporate
├── 👴 Senior travelers → seniors
└── 📚 Solo history enthusiast → history_nerds

Step 2: "What are you interested in?"
├── 🏛️ History & Heritage → [history, heritage categories]
├── 🎨 Art & Culture → [art, culture categories]
├── 🍷 Food & Wine → [food_wine category]
├── 📸 Photography → [photography category]
└── ⚡ Adventure → [adventure category]

Step 3: Results
└── Personalized tour recommendations (max 6)
    ├── Filter by targetAudience
    ├── Filter by categories
    └── Sort by featured, then relevance
```

## Related Code Files

### Create
- `apps/web/components/wizard/concierge-wizard.tsx` - Main wizard
- `apps/web/components/wizard/wizard-step.tsx` - Step component
- `apps/web/components/wizard/wizard-option.tsx` - Option card
- `apps/web/components/wizard/wizard-results.tsx` - Results grid
- `apps/web/components/wizard/wizard-progress.tsx` - Progress indicator
- `apps/web/app/api/tours/recommend/route.ts` - Recommendation API
- `apps/web/lib/hooks/use-wizard-state.ts` - Wizard state hook
- `apps/web/lib/storage/wizard-preferences.ts` - localStorage helper

### Create (additional)
- `apps/web/app/[locale]/find-tour/page.tsx` - Dedicated wizard page

### Modify
- `apps/web/app/[locale]/page.tsx` - Add "Find Your Tour" CTA button (links to /find-tour)
- `messages/sv.json` - Swedish wizard translations
- `messages/en.json` - English wizard translations
- `messages/de.json` - German wizard translations

## Implementation Steps

1. **Create Wizard State Hook**
   ```typescript
   // apps/web/lib/hooks/use-wizard-state.ts
   'use client'

   import { useState, useCallback } from 'react'
   import { saveWizardPreferences, getWizardPreferences } from '../storage/wizard-preferences'

   interface WizardState {
     step: number
     audience: string[]
     interests: string[]
   }

   export function useWizardState() {
     const [state, setState] = useState<WizardState>(() => {
       const saved = getWizardPreferences()
       return saved || { step: 1, audience: [], interests: [] }
     })

     const setAudience = useCallback((audience: string[]) => {
       setState((prev) => {
         const next = { ...prev, audience, step: 2 }
         saveWizardPreferences(next)
         return next
       })
     }, [])

     const setInterests = useCallback((interests: string[]) => {
       setState((prev) => {
         const next = { ...prev, interests, step: 3 }
         saveWizardPreferences(next)
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
   ```

2. **Create Main Wizard Component**
   ```typescript
   // apps/web/components/wizard/concierge-wizard.tsx
   'use client'

   import { useTranslations } from 'next-intl'
   import { useWizardState } from '@/lib/hooks/use-wizard-state'
   import { WizardStep } from './wizard-step'
   import { WizardProgress } from './wizard-progress'
   import { WizardResults } from './wizard-results'
   import { Button } from '@/components/ui/button'
   import { ArrowLeft, RotateCcw } from 'lucide-react'
   import { useState, useEffect } from 'react'

   const audienceOptions = [
     { value: 'family_friendly', emoji: '👨‍👩‍👧‍👦', labelKey: 'family' },
     { value: 'couples', emoji: '💑', labelKey: 'couples' },
     { value: 'corporate', emoji: '🏢', labelKey: 'corporate' },
     { value: 'seniors', emoji: '👴', labelKey: 'seniors' },
     { value: 'history_nerds', emoji: '📚', labelKey: 'historyNerds' }
   ]

   const interestOptions = [
     { value: 'history', emoji: '🏛️', labelKey: 'history' },
     { value: 'art', emoji: '🎨', labelKey: 'art' },
     { value: 'food_wine', emoji: '🍷', labelKey: 'foodWine' },
     { value: 'photography', emoji: '📸', labelKey: 'photography' },
     { value: 'adventure', emoji: '⚡', labelKey: 'adventure' }
   ]

   export function ConciergeWizard() {
     const t = useTranslations('wizard')
     const { step, audience, interests, setAudience, setInterests, goBack, reset } = useWizardState()
     const [tours, setTours] = useState([])
     const [loading, setLoading] = useState(false)

     // Fetch recommendations when reaching step 3
     useEffect(() => {
       if (step === 3 && audience.length > 0) {
         setLoading(true)
         fetch('/api/tours/recommend', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ audience, interests })
         })
           .then((r) => r.json())
           .then(setTours)
           .finally(() => setLoading(false))
       }
     }, [step, audience, interests])

     return (
       <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
         <div className="container max-w-3xl">
           <WizardProgress currentStep={step} totalSteps={3} />

           {/* Step 1: Audience */}
           {step === 1 && (
             <WizardStep
               title={t('step1.title')}
               subtitle={t('step1.subtitle')}
               options={audienceOptions.map((opt) => ({
                 ...opt,
                 label: t(`audience.${opt.labelKey}`)
               }))}
               onSelect={(value) => setAudience([value])}
               allowMultiple={false}
             />
           )}

           {/* Step 2: Interests */}
           {step === 2 && (
             <>
               <WizardStep
                 title={t('step2.title')}
                 subtitle={t('step2.subtitle')}
                 options={interestOptions.map((opt) => ({
                   ...opt,
                   label: t(`interests.${opt.labelKey}`)
                 }))}
                 onSelect={(values) => setInterests(values)}
                 allowMultiple={true}
                 selected={interests}
               />
               <div className="mt-6 flex justify-between">
                 <Button variant="ghost" onClick={goBack}>
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   {t('back')}
                 </Button>
                 <Button onClick={() => setInterests(interests)} disabled={interests.length === 0}>
                   {t('findTours')}
                 </Button>
               </div>
             </>
           )}

           {/* Step 3: Results */}
           {step === 3 && (
             <>
               <WizardResults tours={tours} loading={loading} />
               <div className="mt-6 flex justify-between">
                 <Button variant="ghost" onClick={goBack}>
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   {t('back')}
                 </Button>
                 <Button variant="outline" onClick={reset}>
                   <RotateCcw className="h-4 w-4 mr-2" />
                   {t('startOver')}
                 </Button>
               </div>
             </>
           )}
         </div>
       </section>
     )
   }
   ```

3. **Create Wizard Step Component**
   ```typescript
   // apps/web/components/wizard/wizard-step.tsx
   'use client'

   import { WizardOption } from './wizard-option'
   import { useState } from 'react'

   interface Option {
     value: string
     emoji: string
     label: string
   }

   interface Props {
     title: string
     subtitle?: string
     options: Option[]
     onSelect: (value: string | string[]) => void
     allowMultiple?: boolean
     selected?: string[]
   }

   export function WizardStep({
     title,
     subtitle,
     options,
     onSelect,
     allowMultiple = false,
     selected = []
   }: Props) {
     const [localSelected, setLocalSelected] = useState<string[]>(selected)

     const handleSelect = (value: string) => {
       if (allowMultiple) {
         const next = localSelected.includes(value)
           ? localSelected.filter((v) => v !== value)
           : [...localSelected, value]
         setLocalSelected(next)
       } else {
         onSelect(value)
       }
     }

     return (
       <div className="text-center">
         <h2 className="text-2xl font-bold">{title}</h2>
         {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}

         <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
           {options.map((option) => (
             <WizardOption
               key={option.value}
               emoji={option.emoji}
               label={option.label}
               selected={allowMultiple ? localSelected.includes(option.value) : false}
               onClick={() => handleSelect(option.value)}
             />
           ))}
         </div>
       </div>
     )
   }
   ```

4. **Create Wizard Option Component**
   ```typescript
   // apps/web/components/wizard/wizard-option.tsx
   'use client'

   import { cn } from '@/lib/utils'
   import { Card, CardContent } from '@/components/ui/card'

   interface Props {
     emoji: string
     label: string
     selected?: boolean
     onClick: () => void
   }

   export function WizardOption({ emoji, label, selected, onClick }: Props) {
     return (
       <Card
         role="button"
         tabIndex={0}
         onClick={onClick}
         onKeyDown={(e) => e.key === 'Enter' && onClick()}
         className={cn(
           'cursor-pointer transition-all hover:border-primary hover:shadow-md',
           selected && 'border-primary bg-primary/5 ring-2 ring-primary'
         )}
       >
         <CardContent className="flex flex-col items-center p-6">
           <span className="text-4xl">{emoji}</span>
           <span className="mt-2 font-medium">{label}</span>
         </CardContent>
       </Card>
     )
   }
   ```

5. **Create Results Component**
   ```typescript
   // apps/web/components/wizard/wizard-results.tsx
   import { useTranslations } from 'next-intl'
   import { TourCard } from '@/components/tour/tour-card'
   import { Skeleton } from '@/components/ui/skeleton'

   interface Props {
     tours: any[]
     loading: boolean
   }

   export function WizardResults({ tours, loading }: Props) {
     const t = useTranslations('wizard.results')

     if (loading) {
       return (
         <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {[1, 2, 3].map((i) => (
             <Skeleton key={i} className="h-72 rounded-lg" />
           ))}
         </div>
       )
     }

     if (tours.length === 0) {
       return (
         <div className="mt-8 text-center">
           <p className="text-muted-foreground">{t('noResults')}</p>
         </div>
       )
     }

     return (
       <div>
         <h2 className="text-2xl font-bold text-center">{t('title')}</h2>
         <p className="mt-2 text-center text-muted-foreground">
           {t('subtitle', { count: tours.length })}
         </p>
         <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
           {tours.map((tour) => (
             <TourCard key={tour.id} tour={tour} />
           ))}
         </div>
       </div>
     )
   }
   ```

6. **Create Progress Indicator**
   ```typescript
   // apps/web/components/wizard/wizard-progress.tsx
   import { cn } from '@/lib/utils'

   interface Props {
     currentStep: number
     totalSteps: number
   }

   export function WizardProgress({ currentStep, totalSteps }: Props) {
     return (
       <div className="mb-8 flex justify-center gap-2">
         {Array.from({ length: totalSteps }).map((_, i) => (
           <div
             key={i}
             className={cn(
               'h-2 w-8 rounded-full transition-colors',
               i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
             )}
           />
         ))}
       </div>
     )
   }
   ```

7. **Create Recommendation API**
   ```typescript
   // apps/web/app/api/tours/recommend/route.ts
   import { NextRequest, NextResponse } from 'next/server'
   import { getPayload } from 'payload'
   import config from '@payload-config'

   export async function POST(request: NextRequest) {
     const { audience, interests } = await request.json()

     const payload = await getPayload({ config })

     // Build query conditions
     const conditions: any[] = [{ status: { equals: 'published' } }]

     if (audience?.length > 0) {
       conditions.push({
         targetAudience: { in: audience }
       })
     }

     // Interests map to categories - would need category slugs
     // For MVP, we can use a simple mapping
     if (interests?.length > 0) {
       // Map interest values to category relationships
       // This requires categories to have matching slugs
     }

     const { docs } = await payload.find({
       collection: 'tours',
       where: { and: conditions },
       limit: 6,
       sort: '-featured',
       depth: 2
     })

     return NextResponse.json(docs)
   }
   ```

8. **Create localStorage Helper**
   ```typescript
   // apps/web/lib/storage/wizard-preferences.ts
   const STORAGE_KEY = 'wizard-preferences'

   interface WizardPreferences {
     step: number
     audience: string[]
     interests: string[]
   }

   export function saveWizardPreferences(prefs: WizardPreferences | null) {
     if (typeof window === 'undefined') return
     if (prefs === null) {
       localStorage.removeItem(STORAGE_KEY)
     } else {
       localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
     }
   }

   export function getWizardPreferences(): WizardPreferences | null {
     if (typeof window === 'undefined') return null
     const saved = localStorage.getItem(STORAGE_KEY)
     return saved ? JSON.parse(saved) : null
   }
   ```

9. **Add Translation Strings**
   ```json
   // messages/en.json (add to existing)
   {
     "wizard": {
       "step1": {
         "title": "Who are you traveling with?",
         "subtitle": "Help us find the perfect tour for you"
       },
       "step2": {
         "title": "What interests you?",
         "subtitle": "Select one or more interests"
       },
       "audience": {
         "family": "Family with children",
         "couples": "Couple's getaway",
         "corporate": "Corporate/Team",
         "seniors": "Senior travelers",
         "historyNerds": "History enthusiast"
       },
       "interests": {
         "history": "History & Heritage",
         "art": "Art & Culture",
         "foodWine": "Food & Wine",
         "photography": "Photography",
         "adventure": "Adventure"
       },
       "back": "Back",
       "findTours": "Find Perfect Tours",
       "startOver": "Start Over",
       "results": {
         "title": "Perfect tours for you",
         "subtitle": "We found {count} tours matching your preferences",
         "noResults": "No tours match your criteria. Try different selections."
       }
     }
   }
   ```

10. **Create /find-tour Page** *(Validated: Separate page instead of homepage)*
    ```typescript
    // apps/web/app/[locale]/find-tour/page.tsx
    import { ConciergeWizard } from '@/components/wizard/concierge-wizard'
    import { getTranslations } from 'next-intl/server'

    export default async function FindTourPage({ params: { locale } }) {
      const t = await getTranslations('findTour')

      return (
        <main className="min-h-screen">
          <div className="container py-12">
            <h1 className="text-4xl font-bold text-center">{t('title')}</h1>
            <p className="mt-4 text-center text-muted-foreground">{t('subtitle')}</p>
          </div>
          <ConciergeWizard />
        </main>
      )
    }

    export async function generateMetadata({ params: { locale } }) {
      const t = await getTranslations('findTour')
      return {
        title: t('meta.title'),
        description: t('meta.description')
      }
    }
    ```

11. **Add CTA to Homepage**
    ```typescript
    // apps/web/app/[locale]/page.tsx (update hero or add section)
    import { Button } from '@/components/ui/button'
    import { Link } from '@/i18n/routing'

    // In HeroSection or as separate CTA:
    <Button asChild size="lg" variant="default">
      <Link href="/find-tour">{t('findYourTour')}</Link>
    </Button>
    ```

## Todo List

- [ ] Create useWizardState hook
- [ ] Create ConciergeWizard main component
- [ ] Create WizardStep component
- [ ] Create WizardOption component
- [ ] Create WizardResults component
- [ ] Create WizardProgress component
- [ ] Create recommendation API endpoint
- [ ] Create localStorage helper
- [ ] Create /find-tour page (validated: separate page)
- [ ] Add "Find Your Tour" CTA to homepage hero
- [ ] Add Swedish translations (wizard + findTour)
- [ ] Add English translations (wizard + findTour)
- [ ] Add German translations (wizard + findTour)
- [ ] Style wizard with smooth transitions
- [ ] Test keyboard navigation
- [ ] Test mobile responsiveness
- [ ] Verify audience tag filtering works

## Success Criteria

- [ ] Wizard appears on homepage
- [ ] All audience tags work in wizard
- [ ] Results filter correctly based on selections
- [ ] Mobile responsive (works on phones)
- [ ] Available in all three languages
- [ ] Smooth transitions between steps
- [ ] Back button works correctly
- [ ] Preferences saved to localStorage
- [ ] API response < 500ms

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| No tours match criteria | Medium | Medium | Show helpful message + explore all |
| Slow API response | Low | Medium | Add loading states, optimize query |
| localStorage not available | Low | Low | Graceful fallback to stateless |

## Security Considerations

- Validate API input (audience, interests arrays)
- Sanitize localStorage data on read
- Rate limit recommendation API

## Next Steps

After completion:
1. Proceed to [Phase 09: Group Bookings + WhatsApp](./phase-09-group-bookings-whatsapp.md)
2. Monitor wizard usage analytics
3. A/B test wizard placement
