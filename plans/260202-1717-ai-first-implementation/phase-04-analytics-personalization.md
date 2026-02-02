# Phase 04: Analytics & Personalization

## Context Links

- [PostHog Documentation](https://posthog.com/docs)
- [Phase 03 - Recommendation Engine](./phase-03-recommendation-engine.md)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [GDPR Compliance](https://gdpr.eu/)
- [Current Find Tour Page](../../apps/web/app/[locale]/(frontend)/find-tour/page.tsx)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P2 - High | pending | 16-20h |

Implement comprehensive analytics tracking and user personalization using PostHog. Enable A/B testing, feature flags, user segmentation, and personalized content delivery based on user behavior and preferences.

## Key Insights

1. **PostHog all-in-one**: Analytics, feature flags, A/B tests, session replay
2. **Server-side tracking**: More reliable than client-side (ad blockers)
3. **User identification**: Link anonymous to authenticated seamlessly
4. **Cohort-based personalization**: Group users by behavior patterns
5. **Privacy-first**: GDPR compliant with consent management

## Requirements

### Functional

- Track page views, events, and user journeys
- Session replay for UX debugging
- A/B testing for homepage variants
- Feature flags for gradual rollouts
- User segmentation by behavior
- Personalized homepage sections
- Booking funnel analytics
- Search analytics (queries, results, clicks)

### Non-Functional

- <50ms tracking latency (non-blocking)
- GDPR compliant (consent banner)
- Work with ad blockers (server-side fallback)
- 30-day data retention default
- Real-time dashboard updates
- Support for 10K+ monthly users

## Architecture

### Analytics Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│                     User Interaction                              │
└─────────────────────────────┬────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  Client-Side Tracking   │     │  Server-Side Tracking   │
│  (posthog-js)           │     │  (posthog-node)         │
│  - Page views           │     │  - API events           │
│  - Clicks               │     │  - Bookings             │
│  - Form interactions    │     │  - Server actions       │
│  - Session replay       │     │  - Webhook events       │
└───────────┬─────────────┘     └───────────┬─────────────┘
            │                               │
            └───────────────┬───────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │        PostHog Cloud        │
              │  - Event storage            │
              │  - User profiles            │
              │  - Feature flags            │
              │  - A/B test results         │
              │  - Dashboards               │
              └─────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │    Personalization Layer    │
              │  - User segments            │
              │  - Dynamic content          │
              │  - Recommendations input    │
              └─────────────────────────────┘
```

### User Identification Flow

```
Anonymous User (first visit)
        │
        ▼
Generate anonymous_id (stored in cookie)
        │
        ▼
Track events with anonymous_id
        │
        ├──────── User remains anonymous ──────► Continue tracking
        │
        └──────── User signs up/logs in ───────┐
                                               │
                                               ▼
                                    posthog.identify(user_id, {
                                      email: user.email,
                                      name: user.name,
                                    })
                                               │
                                               ▼
                                    PostHog merges anonymous + authenticated
                                               │
                                               ▼
                                    Full user journey visible
```

### Feature Flag Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Feature Flags in PostHog                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FLAG: new-homepage-hero                                        │
│  ├── 50% control (current hero)                                 │
│  └── 50% variant (new hero with AI recommendations)             │
│                                                                  │
│  FLAG: ai-chatbot-enabled                                       │
│  ├── Property: user.country in ['SE', 'DE']                    │
│  └── Gradual rollout: 25% → 50% → 100%                         │
│                                                                  │
│  FLAG: booking-widget-v2                                        │
│  ├── Beta users only (cohort)                                   │
│  └── Fallback: original widget                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Related Code Files

### Create

| File | Purpose |
|------|---------|
| `apps/web/lib/analytics/posthog-provider.tsx` | PostHog React provider |
| `apps/web/lib/analytics/posthog-server.ts` | Server-side PostHog client |
| `apps/web/lib/analytics/events.ts` | Event type definitions |
| `apps/web/lib/analytics/track-page-view.ts` | Page view tracking hook |
| `apps/web/lib/personalization/feature-flags.ts` | Feature flag helpers |
| `apps/web/lib/personalization/user-segments.ts` | User segmentation logic |
| `apps/web/components/analytics/consent-banner.tsx` | GDPR consent UI |
| `apps/web/components/personalization/personalized-hero.tsx` | A/B test hero |
| `apps/web/app/api/analytics/identify/route.ts` | Server-side identify |

### Modify

| File | Change |
|------|--------|
| `apps/web/app/layout.tsx` | Add PostHog provider |
| `apps/web/app/[locale]/(frontend)/page.tsx` | Add personalized sections |
| `apps/web/middleware.ts` | Feature flag evaluation |
| `.env.example` | Add PostHog keys |

## Implementation Steps

### Step 1: Set Up PostHog Provider

```typescript
// apps/web/lib/analytics/posthog-provider.tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY!
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false, // We'll track manually for SPA
      capture_pageleave: true,
      persistence: 'localStorage+cookie',
      autocapture: {
        dom_event_allowlist: ['click', 'submit'],
        element_allowlist: ['button', 'a', 'form'],
      },
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: '[data-mask]',
      },
      // GDPR compliance
      opt_out_capturing_by_default: false,
      respect_dnt: true,
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}

/**
 * Hook to track page views in Next.js App Router
 */
export function usePageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      const url = searchParams?.toString()
        ? `${pathname}?${searchParams.toString()}`
        : pathname

      posthog.capture('$pageview', {
        $current_url: url,
      })
    }
  }, [pathname, searchParams])
}
```

### Step 2: Create Server-Side Client

```typescript
// apps/web/lib/analytics/posthog-server.ts
import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

export function getPostHogServer(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.POSTHOG_API_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.posthog.com',
      flushAt: 1, // Flush immediately for serverless
      flushInterval: 0,
    })
  }
  return posthogClient
}

/**
 * Track server-side event
 */
export function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): void {
  const posthog = getPostHogServer()
  posthog.capture({
    distinctId,
    event,
    properties: {
      ...properties,
      $lib: 'posthog-node',
    },
  })
}

/**
 * Identify user server-side
 */
export function identifyUser(
  distinctId: string,
  properties: Record<string, unknown>
): void {
  const posthog = getPostHogServer()
  posthog.identify({
    distinctId,
    properties,
  })
}

/**
 * Get feature flag value server-side
 */
export async function getFeatureFlag(
  distinctId: string,
  flag: string,
  defaultValue: boolean | string = false
): Promise<boolean | string> {
  const posthog = getPostHogServer()
  try {
    const value = await posthog.getFeatureFlag(flag, distinctId)
    return value ?? defaultValue
  } catch (error) {
    console.error(`[PostHog] Feature flag error for ${flag}:`, error)
    return defaultValue
  }
}

/**
 * Get all feature flags for user
 */
export async function getAllFeatureFlags(
  distinctId: string
): Promise<Record<string, boolean | string>> {
  const posthog = getPostHogServer()
  try {
    const flags = await posthog.getAllFlags(distinctId)
    return flags
  } catch (error) {
    console.error('[PostHog] Get all flags error:', error)
    return {}
  }
}
```

### Step 3: Define Event Types

```typescript
// apps/web/lib/analytics/events.ts

/**
 * Standardized event names for consistency
 */
export const ANALYTICS_EVENTS = {
  // Page events
  PAGE_VIEW: '$pageview',
  PAGE_LEAVE: '$pageleave',

  // Tour events
  TOUR_VIEW: 'tour_viewed',
  TOUR_GALLERY_OPEN: 'tour_gallery_opened',
  TOUR_SHARE: 'tour_shared',
  TOUR_BOOKMARK: 'tour_bookmarked',

  // Search events
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  FILTER_APPLIED: 'filter_applied',

  // Booking events
  BOOKING_STARTED: 'booking_started',
  BOOKING_DATE_SELECTED: 'booking_date_selected',
  BOOKING_PARTICIPANTS_SET: 'booking_participants_set',
  BOOKING_COMPLETED: 'booking_completed',
  BOOKING_ABANDONED: 'booking_abandoned',

  // Recommendation events
  RECOMMENDATION_SHOWN: 'recommendation_shown',
  RECOMMENDATION_CLICKED: 'recommendation_clicked',

  // User events
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  NEWSLETTER_SUBSCRIBED: 'newsletter_subscribed',

  // Chatbot events
  CHATBOT_OPENED: 'chatbot_opened',
  CHATBOT_MESSAGE_SENT: 'chatbot_message_sent',
  CHATBOT_TOUR_SUGGESTED: 'chatbot_tour_suggested',

  // A/B test events
  EXPERIMENT_VIEWED: '$experiment_viewed',
} as const

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS]

/**
 * Event property schemas
 */
export interface TourViewedProperties {
  tour_id: number
  tour_slug: string
  tour_title: string
  tour_category: string
  tour_price: number
  source: 'search' | 'recommendation' | 'direct' | 'homepage'
}

export interface SearchPerformedProperties {
  query: string
  search_type: 'keyword' | 'semantic'
  results_count: number
  filters_applied: string[]
  locale: string
}

export interface BookingStartedProperties {
  tour_id: number
  tour_slug: string
  price: number
  participants: number
  selected_date: string
}
```

### Step 4: Create Feature Flag Helpers

```typescript
// apps/web/lib/personalization/feature-flags.ts
import { cookies } from 'next/headers'
import { getFeatureFlag, getAllFeatureFlags } from '../analytics/posthog-server'

/**
 * Feature flag names (keep in sync with PostHog dashboard)
 */
export const FLAGS = {
  NEW_HOMEPAGE_HERO: 'new-homepage-hero',
  AI_CHATBOT_ENABLED: 'ai-chatbot-enabled',
  SEMANTIC_SEARCH: 'semantic-search-enabled',
  PERSONALIZED_RECOMMENDATIONS: 'personalized-recommendations',
  BOOKING_WIDGET_V2: 'booking-widget-v2',
  SHOW_REVIEWS_SUMMARY: 'show-reviews-summary',
} as const

export type FeatureFlag = typeof FLAGS[keyof typeof FLAGS]

/**
 * Get user ID from cookies for feature flag evaluation
 */
async function getUserId(): Promise<string> {
  const cookieStore = await cookies()
  return (
    cookieStore.get('user_id')?.value ||
    cookieStore.get('ph_distinct_id')?.value ||
    'anonymous'
  )
}

/**
 * Check if feature is enabled for current user
 */
export async function isFeatureEnabled(flag: FeatureFlag): Promise<boolean> {
  const userId = await getUserId()
  const value = await getFeatureFlag(userId, flag, false)
  return value === true || value === 'true'
}

/**
 * Get feature flag variant (for multivariate tests)
 */
export async function getFeatureVariant(flag: FeatureFlag): Promise<string | null> {
  const userId = await getUserId()
  const value = await getFeatureFlag(userId, flag, '')
  return typeof value === 'string' ? value : null
}

/**
 * Get all flags for SSR (pass to client)
 */
export async function getServerFeatureFlags(): Promise<Record<string, boolean | string>> {
  const userId = await getUserId()
  return getAllFeatureFlags(userId)
}

/**
 * React hook for client-side feature flags
 */
// apps/web/lib/personalization/use-feature-flag.ts
'use client'

import { usePostHog } from 'posthog-js/react'
import { useEffect, useState } from 'react'
import type { FeatureFlag } from './feature-flags'

export function useFeatureFlag(flag: FeatureFlag, defaultValue = false): boolean {
  const posthog = usePostHog()
  const [enabled, setEnabled] = useState(defaultValue)

  useEffect(() => {
    // Check if flags are loaded
    if (posthog.isFeatureEnabled(flag) !== undefined) {
      setEnabled(posthog.isFeatureEnabled(flag) ?? defaultValue)
    }

    // Subscribe to flag changes
    const unsubscribe = posthog.onFeatureFlags(() => {
      setEnabled(posthog.isFeatureEnabled(flag) ?? defaultValue)
    })

    return unsubscribe
  }, [posthog, flag, defaultValue])

  return enabled
}
```

### Step 5: Create User Segmentation

```typescript
// apps/web/lib/personalization/user-segments.ts
import { getPostHogServer } from '../analytics/posthog-server'

/**
 * User segment definitions
 */
export const SEGMENTS = {
  NEW_VISITOR: 'new_visitor',           // First visit
  RETURNING_VISITOR: 'returning_visitor', // 2-5 visits
  ENGAGED_USER: 'engaged_user',          // 5+ visits, >3 tours viewed
  BOOKER: 'booker',                      // Has completed a booking
  HIGH_VALUE: 'high_value',              // Multiple bookings or high spend
  HISTORY_ENTHUSIAST: 'history_enthusiast', // Views mostly history tours
  FAMILY_TRAVELER: 'family_traveler',    // Views family-friendly tours
} as const

export type UserSegment = typeof SEGMENTS[keyof typeof SEGMENTS]

/**
 * Determine user segment based on properties
 */
export function determineUserSegment(userProperties: {
  visit_count?: number
  tours_viewed?: number
  bookings_completed?: number
  total_spend?: number
  category_preferences?: Record<string, number>
}): UserSegment[] {
  const segments: UserSegment[] = []

  const {
    visit_count = 0,
    tours_viewed = 0,
    bookings_completed = 0,
    total_spend = 0,
    category_preferences = {},
  } = userProperties

  // Visit-based segments
  if (visit_count <= 1) {
    segments.push(SEGMENTS.NEW_VISITOR)
  } else if (visit_count <= 5) {
    segments.push(SEGMENTS.RETURNING_VISITOR)
  }

  if (visit_count > 5 && tours_viewed > 3) {
    segments.push(SEGMENTS.ENGAGED_USER)
  }

  // Booking-based segments
  if (bookings_completed > 0) {
    segments.push(SEGMENTS.BOOKER)
  }

  if (bookings_completed >= 3 || total_spend > 5000) {
    segments.push(SEGMENTS.HIGH_VALUE)
  }

  // Interest-based segments
  if ((category_preferences['history'] || 0) > 0.6) {
    segments.push(SEGMENTS.HISTORY_ENTHUSIAST)
  }

  if ((category_preferences['family'] || 0) > 0.5) {
    segments.push(SEGMENTS.FAMILY_TRAVELER)
  }

  return segments
}

/**
 * Get personalized content based on segment
 */
export function getSegmentContent(segment: UserSegment): {
  heroTitle?: string
  heroSubtitle?: string
  ctaText?: string
  featuredCategories?: string[]
} {
  switch (segment) {
    case SEGMENTS.NEW_VISITOR:
      return {
        heroTitle: 'Discover Sweden\'s Hidden Stories',
        heroSubtitle: 'Expert-led tours revealing 800 years of history',
        ctaText: 'Explore Tours',
      }

    case SEGMENTS.RETURNING_VISITOR:
      return {
        heroTitle: 'Welcome Back, Explorer',
        heroSubtitle: 'Ready for your next Swedish adventure?',
        ctaText: 'Continue Exploring',
      }

    case SEGMENTS.HISTORY_ENTHUSIAST:
      return {
        heroTitle: 'Dive Deeper into History',
        heroSubtitle: 'New tours for curious minds',
        ctaText: 'View History Tours',
        featuredCategories: ['history', 'architecture', 'royal'],
      }

    case SEGMENTS.FAMILY_TRAVELER:
      return {
        heroTitle: 'Adventures for the Whole Family',
        heroSubtitle: 'Create memories together in Sweden',
        ctaText: 'Family Tours',
        featuredCategories: ['family', 'outdoor', 'interactive'],
      }

    default:
      return {}
  }
}
```

### Step 6: Create Consent Banner

```typescript
// apps/web/components/analytics/consent-banner.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

const CONSENT_COOKIE = 'analytics_consent'

export function ConsentBanner() {
  const t = useTranslations('consent')
  const posthog = usePostHog()
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if consent already given
    const consent = localStorage.getItem(CONSENT_COOKIE)
    if (!consent) {
      setShowBanner(true)
    } else if (consent === 'denied') {
      posthog.opt_out_capturing()
    }
  }, [posthog])

  const handleAccept = () => {
    localStorage.setItem(CONSENT_COOKIE, 'accepted')
    posthog.opt_in_capturing()
    setShowBanner(false)
  }

  const handleDecline = () => {
    localStorage.setItem(CONSENT_COOKIE, 'denied')
    posthog.opt_out_capturing()
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-white p-4 shadow-lg">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex-1">
          <p className="text-sm text-[var(--color-text)]">
            {t('message')}
          </p>
          <a href="/privacy" className="text-sm text-[var(--color-primary)] underline">
            {t('learnMore')}
          </a>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleDecline}>
            {t('decline')}
          </Button>
          <Button size="sm" onClick={handleAccept}>
            {t('accept')}
          </Button>
        </div>
        <button
          onClick={handleDecline}
          className="absolute right-2 top-2 p-1 text-[var(--color-text-muted)] sm:hidden"
          aria-label={t('close')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

### Step 7: Create Personalized Homepage Section

```typescript
// apps/web/components/personalization/personalized-hero.tsx
'use client'

import { useEffect, useState } from 'react'
import { usePostHog } from 'posthog-js/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PersonalizedHeroProps {
  variant: 'control' | 'personalized'
  userSegment?: string
}

export function PersonalizedHero({ variant, userSegment }: PersonalizedHeroProps) {
  const t = useTranslations('hero')
  const posthog = usePostHog()

  useEffect(() => {
    // Track which variant was shown
    posthog.capture('$experiment_viewed', {
      experiment: 'homepage-hero',
      variant,
      user_segment: userSegment,
    })
  }, [posthog, variant, userSegment])

  // Personalized content based on segment
  const content = getHeroContent(userSegment, t)

  return (
    <section className="relative h-[70vh] min-h-[500px]">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-navy)]/90 to-[var(--color-navy)]/70">
        {/* Hero image */}
      </div>

      {/* Content */}
      <div className="container relative z-10 flex h-full flex-col justify-center px-4">
        <h1 className="max-w-2xl font-serif text-4xl font-bold text-white md:text-5xl lg:text-6xl">
          {content.title}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/90">
          {content.subtitle}
        </p>
        <div className="mt-8 flex gap-4">
          <Button asChild size="lg">
            <Link href="/tours">{content.cta}</Link>
          </Button>
          {variant === 'personalized' && content.secondaryCta && (
            <Button asChild variant="outline" size="lg" className="border-white text-white">
              <Link href={content.secondaryCtaLink || '/find-tour'}>
                {content.secondaryCta}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

function getHeroContent(segment: string | undefined, t: any) {
  // Default content
  const defaultContent = {
    title: t('title'),
    subtitle: t('subtitle'),
    cta: t('cta'),
    secondaryCta: null,
    secondaryCtaLink: null,
  }

  if (!segment) return defaultContent

  // Segment-specific content
  const segmentContent: Record<string, typeof defaultContent> = {
    returning_visitor: {
      ...defaultContent,
      title: t('returning.title'),
      subtitle: t('returning.subtitle'),
      secondaryCta: t('returning.secondaryCta'),
      secondaryCtaLink: '/find-tour',
    },
    history_enthusiast: {
      ...defaultContent,
      title: t('history.title'),
      subtitle: t('history.subtitle'),
      secondaryCta: t('history.secondaryCta'),
      secondaryCtaLink: '/tours?categories=history',
    },
  }

  return segmentContent[segment] || defaultContent
}
```

### Step 8: Environment Variables

```bash
# .env.example additions

# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
POSTHOG_API_KEY=phx_...  # Server-side key (private)
```

## Todo List

- [ ] Set up PostHog account and project
- [ ] Create posthog-provider.tsx
- [ ] Create posthog-server.ts
- [ ] Define events.ts with all event types
- [ ] Create feature-flags.ts helpers
- [ ] Create user-segments.ts
- [ ] Create consent-banner.tsx
- [ ] Create personalized-hero.tsx
- [ ] Add PostHog provider to layout
- [ ] Implement page view tracking
- [ ] Set up booking funnel events
- [ ] Configure feature flags in PostHog dashboard
- [ ] Create A/B test for homepage hero
- [ ] Add consent banner translations (SV/EN/DE)
- [ ] Test GDPR opt-out functionality
- [ ] Set up PostHog dashboards

## Success Criteria

- [ ] All key events tracked in PostHog
- [ ] Session replay working
- [ ] Feature flags evaluating correctly
- [ ] A/B test running with proper randomization
- [ ] GDPR consent respected
- [ ] <50ms tracking latency
- [ ] Booking funnel visualized in dashboard

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Ad blocker blocking | High | Medium | Server-side fallback |
| GDPR violation | Low | High | Consent banner, opt-out |
| Performance impact | Medium | Medium | Async loading, batching |
| Data quality issues | Medium | Medium | Event schema validation |
| Privacy complaints | Low | High | Clear privacy policy |

## Security Considerations

1. **API Key Protection**: Server key in env vars only
2. **PII Handling**: Mask inputs in session replay
3. **Consent Management**: Honor opt-out, delete data on request
4. **Data Retention**: 30-day default, configurable
5. **IP Anonymization**: Enable in PostHog settings

## Next Steps

After Phase 04 completion:
1. **Phase 05**: Feed analytics into domain LLM
2. **Advanced Segmentation**: ML-based user clustering
3. **Predictive Analytics**: Booking probability scores
4. **Real-time Personalization**: Dynamic content per user

---

**Unresolved Questions:**

1. PostHog EU vs US hosting for GDPR?
2. Session replay consent - separate from analytics?
3. How long to run A/B tests before significance?
4. Should we track scroll depth on tour pages?
