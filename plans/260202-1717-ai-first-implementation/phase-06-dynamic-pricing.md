# Phase 06: Dynamic Pricing

## Context Links

- [Phase 03 - Recommendation Engine](./phase-03-recommendation-engine.md) - User behavior tracking
- [Phase 04 - Analytics & Personalization](./phase-04-analytics-personalization.md) - PostHog integration
- [Tours Collection](../../packages/cms/collections/tours.ts)
- [Bokun Integration](../../plans/mvp-implementation/phase-08.1-bokun-integration.md)
- [Dynamic Pricing Strategies](https://www.dynamicpricing.com/)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P3 - Medium | pending | 12-16h |

Implement AI-driven dynamic pricing that optimizes tour prices based on demand patterns, seasonality, competitor analysis, and historical booking data. Provide price suggestions in CMS admin and enable A/B testing of pricing strategies.

## Key Insights

1. **Demand-based adjustments**: Increase prices during high-demand periods (holidays, weekends)
2. **Seasonality**: Swedish tourism peaks May-September, adjust accordingly
3. **Lead time pricing**: Last-minute bookings vs. early bird discounts
4. **Competitor awareness**: Track competitor prices for similar tours
5. **Gradual rollout**: Start with suggestions, not automatic changes

## Requirements

### Functional

- Calculate optimal price based on multiple factors
- Display price suggestions in CMS admin (tour edit page)
- Historical price performance dashboard
- A/B test different pricing strategies
- Seasonal pricing rules configuration
- Revenue optimization analytics
- Price change audit trail
- Override capabilities for manual control

### Non-Functional

- Price calculation <500ms
- Update suggestions daily (batch job)
- Minimum 30 days historical data for ML predictions
- GDPR-compliant (no customer data in pricing model)
- Audit logging for all price changes
- Fallback to base price on errors

## Architecture

### Pricing Engine Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Dynamic Pricing Engine                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INPUT SIGNALS                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Historical Data │  │ Demand Signals  │  │ External Data   │  │
│  │ - Past bookings │  │ - Search volume │  │ - Competitor    │  │
│  │ - Conversion    │  │ - Page views    │  │   prices        │  │
│  │ - Seasonal      │  │ - Cart adds     │  │ - Events        │  │
│  │   patterns      │  │ - Time to tour  │  │ - Weather       │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                 │
│                                ▼                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Pricing Algorithm                         │ │
│  │                                                              │ │
│  │  Base Price → Demand Multiplier → Seasonal Adj → Final     │ │
│  │                                                              │ │
│  │  price = base * demand_factor * season_factor * lead_factor │ │
│  │                                                              │ │
│  │  Constraints:                                                │ │
│  │  - Min: base * 0.85 (max 15% discount)                      │ │
│  │  - Max: base * 1.40 (max 40% increase)                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                 │
│                                ▼                                 │
│  OUTPUT                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Price Suggestion│  │ A/B Test Groups │  │ Analytics       │  │
│  │ (CMS Admin)     │  │ (Frontend)      │  │ (Dashboard)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Pricing rules configuration
CREATE TABLE pricing_rules (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER REFERENCES tours(id),
  rule_type TEXT NOT NULL,  -- 'seasonal', 'demand', 'lead_time', 'day_of_week'
  conditions JSONB NOT NULL,  -- {"months": [6,7,8], "multiplier": 1.2}
  multiplier FLOAT NOT NULL DEFAULT 1.0,
  priority INTEGER DEFAULT 0,  -- Higher priority rules apply first
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Historical pricing data
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER REFERENCES tours(id),
  date DATE NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  suggested_price DECIMAL(10,2),
  actual_price DECIMAL(10,2),
  demand_score FLOAT,  -- 0-1 scale
  bookings_count INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tour_id, date)
);

-- A/B test experiments
CREATE TABLE pricing_experiments (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER REFERENCES tours(id),
  name TEXT NOT NULL,
  variant_a_config JSONB NOT NULL,  -- {"multiplier": 1.0}
  variant_b_config JSONB NOT NULL,  -- {"multiplier": 1.1}
  traffic_split FLOAT DEFAULT 0.5,  -- 50/50 by default
  status TEXT DEFAULT 'draft',  -- 'draft', 'running', 'completed'
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  winner TEXT,  -- 'a', 'b', or null
  created_at TIMESTAMP DEFAULT NOW()
);

-- Experiment results
CREATE TABLE experiment_results (
  id SERIAL PRIMARY KEY,
  experiment_id INTEGER REFERENCES pricing_experiments(id),
  variant TEXT NOT NULL,  -- 'a' or 'b'
  impressions INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Competitor price tracking
CREATE TABLE competitor_prices (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER REFERENCES tours(id),
  competitor_name TEXT NOT NULL,
  competitor_url TEXT,
  competitor_price DECIMAL(10,2),
  scraped_at TIMESTAMP DEFAULT NOW()
);
```

## Related Code Files

### Create

| File | Purpose |
|------|---------|
| `apps/web/lib/pricing/pricing-engine.ts` | Core pricing calculation |
| `apps/web/lib/pricing/demand-calculator.ts` | Demand signal processing |
| `apps/web/lib/pricing/seasonal-rules.ts` | Seasonal adjustments |
| `apps/web/lib/pricing/ab-testing.ts` | A/B test management |
| `apps/web/app/api/pricing/suggest/route.ts` | Price suggestion API |
| `apps/web/app/api/pricing/experiments/route.ts` | A/B test API |
| `packages/cms/collections/pricing-rules.ts` | Pricing rules collection |
| `packages/cms/components/price-suggestion-field.tsx` | CMS price widget |
| `packages/cms/migrations/add-pricing-tables.ts` | Database migration |

### Modify

| File | Change |
|------|--------|
| `packages/cms/collections/tours.ts` | Add dynamic price field |
| `packages/cms/payload.config.ts` | Add pricing-rules collection |
| `apps/web/components/tour/booking-section.tsx` | Display dynamic price |

## Implementation Steps

### Step 1: Create Pricing Engine

```typescript
// apps/web/lib/pricing/pricing-engine.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'
import { calculateDemandScore } from './demand-calculator'
import { getSeasonalMultiplier } from './seasonal-rules'

export interface PriceCalculation {
  basePrice: number
  suggestedPrice: number
  factors: PriceFactor[]
  confidence: number  // 0-1 how confident in suggestion
}

export interface PriceFactor {
  name: string
  multiplier: number
  reason: string
}

interface PricingOptions {
  tourId: number
  date: Date
  includeCompetitors?: boolean
}

const PRICE_BOUNDS = {
  minMultiplier: 0.85,  // Max 15% discount
  maxMultiplier: 1.40,  // Max 40% increase
}

/**
 * Calculate optimal price for a tour on a specific date
 */
export async function calculateOptimalPrice(
  options: PricingOptions
): Promise<PriceCalculation> {
  const { tourId, date, includeCompetitors = false } = options

  const payload = await getPayload({ config })

  // Get base price from tour
  const tour = await payload.findByID({
    collection: 'tours',
    id: tourId,
  })

  if (!tour) {
    throw new Error(`Tour ${tourId} not found`)
  }

  const basePrice = tour.pricing?.basePrice || 0
  const factors: PriceFactor[] = []
  let combinedMultiplier = 1.0

  // Factor 1: Demand score
  const demandScore = await calculateDemandScore(tourId, date)
  const demandMultiplier = 1 + (demandScore - 0.5) * 0.4  // -0.2 to +0.2
  factors.push({
    name: 'demand',
    multiplier: demandMultiplier,
    reason: `Demand score: ${(demandScore * 100).toFixed(0)}%`,
  })
  combinedMultiplier *= demandMultiplier

  // Factor 2: Seasonality
  const seasonalMultiplier = getSeasonalMultiplier(date)
  factors.push({
    name: 'seasonal',
    multiplier: seasonalMultiplier,
    reason: `${getSeasonName(date)} season`,
  })
  combinedMultiplier *= seasonalMultiplier

  // Factor 3: Lead time (days until tour)
  const daysUntilTour = Math.ceil(
    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const leadTimeMultiplier = getLeadTimeMultiplier(daysUntilTour)
  factors.push({
    name: 'lead_time',
    multiplier: leadTimeMultiplier,
    reason: `${daysUntilTour} days until tour`,
  })
  combinedMultiplier *= leadTimeMultiplier

  // Factor 4: Day of week
  const dayOfWeek = date.getDay()
  const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.1 : 1.0
  if (weekendMultiplier !== 1.0) {
    factors.push({
      name: 'weekend',
      multiplier: weekendMultiplier,
      reason: 'Weekend premium',
    })
    combinedMultiplier *= weekendMultiplier
  }

  // Apply bounds
  combinedMultiplier = Math.max(
    PRICE_BOUNDS.minMultiplier,
    Math.min(PRICE_BOUNDS.maxMultiplier, combinedMultiplier)
  )

  const suggestedPrice = Math.round(basePrice * combinedMultiplier)

  // Calculate confidence based on data availability
  const confidence = calculateConfidence(demandScore, daysUntilTour)

  return {
    basePrice,
    suggestedPrice,
    factors,
    confidence,
  }
}

function getLeadTimeMultiplier(days: number): number {
  if (days <= 2) return 1.15      // Last minute premium
  if (days <= 7) return 1.05      // Week out
  if (days >= 30) return 0.95     // Early bird discount
  return 1.0
}

function getSeasonName(date: Date): string {
  const month = date.getMonth()
  if (month >= 4 && month <= 8) return 'peak'    // May-Sep
  if (month >= 11 || month <= 1) return 'low'    // Dec-Feb
  return 'shoulder'
}

function calculateConfidence(demandScore: number, daysUntil: number): number {
  // More confidence with more data and reasonable lead time
  let confidence = 0.5
  if (demandScore > 0) confidence += 0.2
  if (daysUntil >= 3 && daysUntil <= 60) confidence += 0.2
  return Math.min(confidence, 0.95)
}
```

### Step 2: Create Demand Calculator

```typescript
// apps/web/lib/pricing/demand-calculator.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Calculate demand score (0-1) for a tour on a date
 * Based on historical bookings, page views, search volume
 */
export async function calculateDemandScore(
  tourId: number,
  targetDate: Date
): Promise<number> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const dayOfWeek = targetDate.getDay()
  const month = targetDate.getMonth()

  // Get historical booking patterns for same day/month
  const historicalData = await db.execute(sql`
    SELECT
      AVG(bookings_count) as avg_bookings,
      MAX(bookings_count) as max_bookings,
      COUNT(*) as data_points
    FROM price_history
    WHERE tour_id = ${tourId}
      AND EXTRACT(DOW FROM date) = ${dayOfWeek}
      AND EXTRACT(MONTH FROM date) = ${month + 1}
      AND date < CURRENT_DATE
  `)

  const history = historicalData.rows[0] as any

  // Get recent page views (last 7 days)
  const recentViews = await db.execute(sql`
    SELECT COUNT(*) as view_count
    FROM user_tour_interactions
    WHERE tour_id = ${tourId}
      AND event_type = 'tour_view'
      AND created_at > NOW() - INTERVAL '7 days'
  `)

  const viewCount = parseInt((recentViews.rows[0] as any)?.view_count || '0')

  // Calculate demand score components
  let score = 0.5  // Base score

  // Historical booking component (30% weight)
  if (history.data_points > 0 && history.max_bookings > 0) {
    const historicalRatio = history.avg_bookings / history.max_bookings
    score += (historicalRatio - 0.5) * 0.3
  }

  // Recent views component (40% weight)
  // Assume 50 views/week is average
  const viewRatio = Math.min(viewCount / 50, 2)
  score += (viewRatio - 1) * 0.2

  // Normalize to 0-1
  return Math.max(0, Math.min(1, score))
}

/**
 * Get demand trends over time for dashboard
 */
export async function getDemandTrends(
  tourId: number,
  days: number = 30
): Promise<{ date: string; score: number }[]> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const results = await db.execute(sql`
    SELECT
      date,
      demand_score as score
    FROM price_history
    WHERE tour_id = ${tourId}
      AND date >= CURRENT_DATE - ${days}
    ORDER BY date ASC
  `)

  return results.rows.map((row: any) => ({
    date: row.date,
    score: row.score || 0.5,
  }))
}
```

### Step 3: Create Seasonal Rules

```typescript
// apps/web/lib/pricing/seasonal-rules.ts

interface SeasonConfig {
  name: string
  months: number[]  // 0-11
  multiplier: number
}

// Swedish-specific seasonality
const SEASONS: SeasonConfig[] = [
  { name: 'peak', months: [5, 6, 7, 8], multiplier: 1.20 },     // Jun-Sep
  { name: 'shoulder_spring', months: [3, 4], multiplier: 1.05 }, // Apr-May
  { name: 'shoulder_fall', months: [9, 10], multiplier: 1.00 },  // Oct-Nov
  { name: 'low', months: [11, 0, 1, 2], multiplier: 0.90 },      // Dec-Mar
]

// Special events/holidays
const SPECIAL_DATES: { month: number; day: number; multiplier: number; name: string }[] = [
  { month: 5, day: 6, multiplier: 1.30, name: 'Sweden National Day' },
  { month: 5, day: 21, multiplier: 1.25, name: 'Midsummer Eve' },
  { month: 11, day: 13, multiplier: 1.15, name: 'Lucia' },
  { month: 11, day: 24, multiplier: 0.85, name: 'Christmas Eve' },
  { month: 11, day: 25, multiplier: 0.85, name: 'Christmas Day' },
  { month: 11, day: 31, multiplier: 1.20, name: 'New Year Eve' },
]

/**
 * Get seasonal multiplier for a specific date
 */
export function getSeasonalMultiplier(date: Date): number {
  const month = date.getMonth()
  const day = date.getDate()

  // Check special dates first
  const specialDate = SPECIAL_DATES.find(
    (s) => s.month === month && s.day === day
  )
  if (specialDate) {
    return specialDate.multiplier
  }

  // Check seasons
  const season = SEASONS.find((s) => s.months.includes(month))
  return season?.multiplier || 1.0
}

/**
 * Get all pricing rules for a date range
 */
export function getSeasonalRulesForRange(
  startDate: Date,
  endDate: Date
): { date: Date; multiplier: number; reason: string }[] {
  const rules: { date: Date; multiplier: number; reason: string }[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    const month = current.getMonth()
    const day = current.getDate()

    const specialDate = SPECIAL_DATES.find(
      (s) => s.month === month && s.day === day
    )

    if (specialDate) {
      rules.push({
        date: new Date(current),
        multiplier: specialDate.multiplier,
        reason: specialDate.name,
      })
    } else {
      const season = SEASONS.find((s) => s.months.includes(month))
      if (season && season.multiplier !== 1.0) {
        rules.push({
          date: new Date(current),
          multiplier: season.multiplier,
          reason: `${season.name} season`,
        })
      }
    }

    current.setDate(current.getDate() + 1)
  }

  return rules
}
```

### Step 4: Create A/B Testing Service

```typescript
// apps/web/lib/pricing/ab-testing.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'

export interface Experiment {
  id: number
  tourId: number
  name: string
  variantA: { multiplier: number }
  variantB: { multiplier: number }
  trafficSplit: number
  status: 'draft' | 'running' | 'completed'
}

/**
 * Get active experiment for a tour
 */
export async function getActiveExperiment(
  tourId: number
): Promise<Experiment | null> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const result = await db.execute(sql`
    SELECT * FROM pricing_experiments
    WHERE tour_id = ${tourId}
      AND status = 'running'
    LIMIT 1
  `)

  if (result.rows.length === 0) return null

  const row = result.rows[0] as any
  return {
    id: row.id,
    tourId: row.tour_id,
    name: row.name,
    variantA: row.variant_a_config,
    variantB: row.variant_b_config,
    trafficSplit: row.traffic_split,
    status: row.status,
  }
}

/**
 * Assign user to experiment variant
 */
export function assignVariant(
  userId: string,
  experiment: Experiment
): 'a' | 'b' {
  // Deterministic assignment based on user ID
  const hash = hashCode(userId + experiment.id)
  const normalized = Math.abs(hash) / 2147483647  // Normalize to 0-1

  return normalized < experiment.trafficSplit ? 'a' : 'b'
}

/**
 * Record experiment impression/conversion
 */
export async function recordExperimentEvent(
  experimentId: number,
  variant: 'a' | 'b',
  eventType: 'impression' | 'booking',
  revenue?: number
): Promise<void> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  if (eventType === 'impression') {
    await db.execute(sql`
      INSERT INTO experiment_results (experiment_id, variant, impressions)
      VALUES (${experimentId}, ${variant}, 1)
      ON CONFLICT (experiment_id, variant)
      DO UPDATE SET
        impressions = experiment_results.impressions + 1,
        updated_at = NOW()
    `)
  } else {
    await db.execute(sql`
      UPDATE experiment_results
      SET
        bookings = bookings + 1,
        revenue = revenue + ${revenue || 0},
        updated_at = NOW()
      WHERE experiment_id = ${experimentId} AND variant = ${variant}
    `)
  }
}

/**
 * Calculate statistical significance
 */
export function calculateSignificance(
  variantA: { impressions: number; conversions: number },
  variantB: { impressions: number; conversions: number }
): { significant: boolean; pValue: number; winner: 'a' | 'b' | null } {
  const rateA = variantA.conversions / variantA.impressions
  const rateB = variantB.conversions / variantB.impressions

  // Simplified z-test for proportions
  const pooledRate = (variantA.conversions + variantB.conversions) /
    (variantA.impressions + variantB.impressions)

  const standardError = Math.sqrt(
    pooledRate * (1 - pooledRate) *
    (1/variantA.impressions + 1/variantB.impressions)
  )

  const zScore = (rateA - rateB) / standardError
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)))

  return {
    significant: pValue < 0.05,
    pValue,
    winner: pValue < 0.05 ? (rateA > rateB ? 'a' : 'b') : null,
  }
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash
}

function normalCDF(z: number): number {
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911

  const sign = z < 0 ? -1 : 1
  z = Math.abs(z) / Math.sqrt(2)

  const t = 1.0 / (1.0 + p * z)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z)

  return 0.5 * (1.0 + sign * y)
}
```

### Step 5: Create Price Suggestion API

```typescript
// apps/web/app/api/pricing/suggest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { calculateOptimalPrice } from '@/lib/pricing/pricing-engine'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const tourId = parseInt(searchParams.get('tourId') || '')
  const dateStr = searchParams.get('date')

  if (!tourId || isNaN(tourId)) {
    return NextResponse.json({ error: 'tourId required' }, { status: 400 })
  }

  const date = dateStr ? new Date(dateStr) : new Date()

  try {
    const calculation = await calculateOptimalPrice({
      tourId,
      date,
      includeCompetitors: false,
    })

    return NextResponse.json({
      tourId,
      date: date.toISOString(),
      ...calculation,
    })
  } catch (error) {
    console.error('[Pricing API]', error)
    return NextResponse.json(
      { error: 'Failed to calculate price' },
      { status: 500 }
    )
  }
}
```

### Step 6: Create CMS Price Suggestion Field

```typescript
// packages/cms/components/price-suggestion-field.tsx
'use client'

import { useField, useFormFields } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

interface PriceSuggestion {
  suggestedPrice: number
  confidence: number
  factors: { name: string; multiplier: number; reason: string }[]
}

export function PriceSuggestionField() {
  const { value: tourId } = useFormFields(([fields]) => fields.id)
  const basePrice = useFormFields(([fields]) => fields['pricing.basePrice'])
  const [suggestion, setSuggestion] = useState<PriceSuggestion | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tourId) return

    async function fetchSuggestion() {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/pricing/suggest?tourId=${tourId}&date=${new Date().toISOString()}`
        )
        if (response.ok) {
          const data = await response.json()
          setSuggestion(data)
        }
      } catch (error) {
        console.error('Failed to fetch price suggestion:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestion()
  }, [tourId])

  if (!tourId || loading) {
    return <div className="text-gray-500">Loading price suggestion...</div>
  }

  if (!suggestion) {
    return <div className="text-gray-500">No suggestion available</div>
  }

  const priceDiff = suggestion.suggestedPrice - (basePrice?.value || 0)
  const diffPercent = ((priceDiff / (basePrice?.value || 1)) * 100).toFixed(1)

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h4 className="mb-2 font-medium">AI Price Suggestion</h4>

      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold">
          {suggestion.suggestedPrice} SEK
        </span>
        <span className={`text-sm ${priceDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {priceDiff > 0 ? '+' : ''}{diffPercent}%
        </span>
      </div>

      <div className="mb-2 text-sm text-gray-600">
        Confidence: {(suggestion.confidence * 100).toFixed(0)}%
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-blue-600">View factors</summary>
        <ul className="mt-2 space-y-1">
          {suggestion.factors.map((factor, i) => (
            <li key={i} className="flex justify-between">
              <span>{factor.reason}</span>
              <span className="font-mono">
                {factor.multiplier > 1 ? '+' : ''}
                {((factor.multiplier - 1) * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
```

## Todo List

- [ ] Create database migration for pricing tables
- [ ] Implement pricing-engine.ts
- [ ] Implement demand-calculator.ts
- [ ] Implement seasonal-rules.ts
- [ ] Implement ab-testing.ts
- [ ] Create /api/pricing/suggest endpoint
- [ ] Create /api/pricing/experiments endpoint
- [ ] Create CMS price suggestion field component
- [ ] Add pricing rules collection to CMS
- [ ] Create daily batch job for price updates
- [ ] Build revenue dashboard component
- [ ] Add price history tracking hook
- [ ] Implement competitor price scraping (manual input first)
- [ ] Add A/B test assignment to booking flow
- [ ] Create analytics dashboard for pricing performance
- [ ] Test seasonal multipliers with Swedish calendar

## Success Criteria

- [ ] Price suggestions display in CMS admin
- [ ] Suggestions within 15% of manual prices (validation)
- [ ] A/B tests can be created and run
- [ ] Revenue dashboard shows pricing impact
- [ ] Audit trail for all price changes
- [ ] <500ms API response time

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Wrong price suggestions | Medium | High | Start with suggestions only, manual approval |
| Customer complaints | Low | High | Gradual rollout, price bounds |
| Insufficient data | High initially | Medium | Fallback to base price |
| Gaming by competitors | Low | Medium | Don't expose pricing algorithm |
| Technical failure | Low | Medium | Fallback to static prices |

## Security Considerations

1. **Admin-only access**: Pricing APIs require authentication
2. **Audit logging**: Track all price changes with user ID
3. **Rate limiting**: Prevent scraping of price suggestions
4. **No customer data**: Pricing model uses aggregated data only
5. **Bounds enforcement**: Hard limits prevent extreme prices

## Next Steps

After Phase 06 completion:
1. **ML Integration**: Train model on historical data
2. **Competitor Monitoring**: Automated price scraping
3. **Customer Segmentation**: Different prices for segments
4. **Bundle Pricing**: Multi-tour discounts

---

**Unresolved Questions:**

1. Should price suggestions auto-apply or require manual approval?
2. How to handle refunds when prices change?
3. Competitor price scraping - manual or automated?
4. Customer-visible price history (show original vs discounted)?
