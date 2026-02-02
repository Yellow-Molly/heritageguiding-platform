# Phase 08: Demand Forecasting

## Context Links

- [Phase 03 - Recommendation Engine](./phase-03-recommendation-engine.md) - User behavior data
- [Phase 04 - Analytics & Personalization](./phase-04-analytics-personalization.md) - PostHog integration
- [Phase 06 - Dynamic Pricing](./phase-06-dynamic-pricing.md) - Demand signals
- [Tours Collection](../../packages/cms/collections/tours.ts)
- [Time Series Forecasting](https://otexts.com/fpp3/)
- [Prophet by Meta](https://facebook.github.io/prophet/)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P3 - Medium | pending | 16-20h |

Implement demand forecasting using historical booking data to predict future booking patterns. Enable seasonal trend analysis, capacity planning suggestions, and alerts for high/low demand periods. Drive operational efficiency and marketing decisions.

## Key Insights

1. **Minimum data**: Need 6+ months of historical data for reliable forecasts
2. **Seasonality patterns**: Swedish tourism has strong weekly/yearly cycles
3. **External factors**: Events, weather, holidays significantly impact demand
4. **Granularity**: Forecast at tour-level and aggregate-level
5. **Uncertainty**: Always provide confidence intervals

## Requirements

### Functional

- Predict daily bookings 30/60/90 days ahead
- Identify seasonal patterns (weekly, monthly, yearly)
- Detect anomalies in booking patterns
- Generate capacity planning recommendations
- Alert system for high/low demand periods
- Compare forecasts vs. actuals dashboard
- Factor in external events (holidays, local events)
- Export forecasts for marketing team

### Non-Functional

- Forecast generation <5s per tour
- Update forecasts daily (batch job)
- Minimum 70% accuracy (MAPE <30%)
- Store 2 years of historical data
- Handle missing data gracefully
- Fallback to simple models if data insufficient

## Architecture

### Forecasting Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    Demand Forecasting Pipeline                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DATA COLLECTION                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Historical Bookings    Page Views    External Events       │ │
│  │  ┌─────────────────┐   ┌──────────┐   ┌─────────────────┐  │ │
│  │  │ - Date          │   │ - Date   │   │ - Holidays      │  │ │
│  │  │ - Tour ID       │   │ - Count  │   │ - Local events  │  │ │
│  │  │ - Quantity      │   │ - Source │   │ - Weather       │  │ │
│  │  │ - Revenue       │   └──────────┘   │ - Competitor    │  │ │
│  │  └─────────────────┘                  └─────────────────┘  │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  FEATURE ENGINEERING                                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Time Features          Lag Features       External         │ │
│  │  - Day of week          - Bookings t-7     - Holiday flag   │ │
│  │  - Month                - Bookings t-14    - Event flag     │ │
│  │  - Season               - Moving avg 7d    - Weather        │ │
│  │  - Year                 - Moving avg 30d                    │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  FORECASTING MODELS                                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │ Simple MA   │  │ Exponential │  │ Prophet (if data    │ │ │
│  │  │ (fallback)  │  │ Smoothing   │  │ sufficient)         │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  │                                                              │ │
│  │  Model Selection: Based on data availability                │ │
│  │  - <30 days: Moving Average                                 │ │
│  │  - 30-180 days: Exponential Smoothing                       │ │
│  │  - >180 days: Prophet with seasonality                      │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  OUTPUT                                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Forecast Values    Confidence Intervals    Alerts          │ │
│  │  ┌─────────────┐   ┌──────────────────┐   ┌─────────────┐  │ │
│  │  │ - Date      │   │ - Lower bound    │   │ - High      │  │ │
│  │  │ - Predicted │   │ - Upper bound    │   │   demand    │  │ │
│  │  │ - Tour ID   │   │ - Confidence %   │   │ - Low       │  │ │
│  │  └─────────────┘   └──────────────────┘   │   demand    │  │ │
│  │                                           └─────────────┘  │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Historical booking aggregates
CREATE TABLE booking_history (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER REFERENCES tours(id),
  date DATE NOT NULL,
  bookings_count INTEGER DEFAULT 0,
  participants_count INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  search_impressions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tour_id, date)
);

CREATE INDEX idx_booking_history_tour_date ON booking_history(tour_id, date);

-- Forecasts storage
CREATE TABLE demand_forecasts (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER REFERENCES tours(id),
  forecast_date DATE NOT NULL,  -- Date being forecasted
  generated_at TIMESTAMP NOT NULL,  -- When forecast was created
  model_type TEXT NOT NULL,  -- 'moving_avg', 'exp_smoothing', 'prophet'
  predicted_bookings FLOAT NOT NULL,
  predicted_revenue FLOAT,
  confidence_lower FLOAT,
  confidence_upper FLOAT,
  confidence_level FLOAT DEFAULT 0.95,
  features_used JSONB,  -- {"seasonality": true, "holidays": true}
  UNIQUE(tour_id, forecast_date, generated_at)
);

CREATE INDEX idx_forecasts_tour_date ON demand_forecasts(tour_id, forecast_date);

-- Demand alerts
CREATE TABLE demand_alerts (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER REFERENCES tours(id),
  alert_type TEXT NOT NULL,  -- 'high_demand', 'low_demand', 'anomaly'
  alert_date DATE NOT NULL,
  severity TEXT DEFAULT 'medium',  -- 'low', 'medium', 'high'
  message TEXT NOT NULL,
  predicted_value FLOAT,
  threshold_value FLOAT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by INTEGER REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- External events calendar
CREATE TABLE external_events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'holiday', 'festival', 'conference', 'weather'
  date_start DATE NOT NULL,
  date_end DATE,
  impact_factor FLOAT DEFAULT 1.0,  -- Multiplier effect on demand
  recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT,  -- 'yearly', 'monthly'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_date ON external_events(date_start, date_end);
```

## Related Code Files

### Create

| File | Purpose |
|------|---------|
| `apps/web/lib/forecasting/forecast-service.ts` | Core forecasting logic |
| `apps/web/lib/forecasting/models/moving-average.ts` | Simple MA model |
| `apps/web/lib/forecasting/models/exponential-smoothing.ts` | Holt-Winters |
| `apps/web/lib/forecasting/models/prophet-wrapper.ts` | Prophet integration |
| `apps/web/lib/forecasting/feature-engineering.ts` | Feature extraction |
| `apps/web/lib/forecasting/alert-service.ts` | Demand alerts |
| `apps/web/app/api/forecasting/predict/route.ts` | Forecast API |
| `apps/web/app/api/forecasting/alerts/route.ts` | Alerts API |
| `packages/cms/collections/external-events.ts` | Events collection |
| `packages/cms/components/forecast-chart.tsx` | Admin forecast chart |
| `packages/cms/migrations/add-forecasting-tables.ts` | Database migration |

### Modify

| File | Change |
|------|--------|
| `packages/cms/collections/tours.ts` | Add forecast summary field |
| `apps/web/lib/pricing/demand-calculator.ts` | Use forecasts |

## Implementation Steps

### Step 1: Create Forecast Service

```typescript
// apps/web/lib/forecasting/forecast-service.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'
import { movingAverage } from './models/moving-average'
import { exponentialSmoothing } from './models/exponential-smoothing'
import { prophetForecast } from './models/prophet-wrapper'
import { extractFeatures, TimeSeriesData } from './feature-engineering'

export interface ForecastResult {
  date: Date
  predicted: number
  lower: number
  upper: number
  confidence: number
}

export interface ForecastOptions {
  tourId: number
  horizonDays: number  // How many days ahead to forecast
  includeRevenue?: boolean
}

/**
 * Generate demand forecast for a tour
 */
export async function generateForecast(
  options: ForecastOptions
): Promise<ForecastResult[]> {
  const { tourId, horizonDays = 30, includeRevenue = false } = options

  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // Get historical data
  const historyResult = await db.execute(sql`
    SELECT date, bookings_count, revenue, page_views
    FROM booking_history
    WHERE tour_id = ${tourId}
    ORDER BY date ASC
  `)

  const history = historyResult.rows as any[]
  const dataPoints = history.length

  if (dataPoints === 0) {
    // No data - return zero forecast
    return generateEmptyForecast(horizonDays)
  }

  // Extract features
  const features = extractFeatures(history)

  // Select model based on data availability
  let forecasts: ForecastResult[]
  let modelType: string

  if (dataPoints < 30) {
    // Insufficient data - use simple moving average
    modelType = 'moving_avg'
    forecasts = await movingAverage(history, horizonDays, 7)
  } else if (dataPoints < 180) {
    // Medium data - use exponential smoothing
    modelType = 'exp_smoothing'
    forecasts = await exponentialSmoothing(history, horizonDays, features)
  } else {
    // Sufficient data - use Prophet
    modelType = 'prophet'
    forecasts = await prophetForecast(history, horizonDays, features)
  }

  // Store forecasts
  await storeForecast(tourId, forecasts, modelType, features)

  return forecasts
}

/**
 * Get existing forecast for a tour
 */
export async function getForecast(
  tourId: number,
  startDate: Date,
  endDate: Date
): Promise<ForecastResult[]> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const result = await db.execute(sql`
    SELECT
      forecast_date as date,
      predicted_bookings as predicted,
      confidence_lower as lower,
      confidence_upper as upper,
      confidence_level as confidence
    FROM demand_forecasts
    WHERE tour_id = ${tourId}
      AND forecast_date BETWEEN ${startDate} AND ${endDate}
      AND generated_at = (
        SELECT MAX(generated_at)
        FROM demand_forecasts
        WHERE tour_id = ${tourId}
      )
    ORDER BY forecast_date ASC
  `)

  return result.rows.map((row: any) => ({
    date: new Date(row.date),
    predicted: row.predicted,
    lower: row.lower,
    upper: row.upper,
    confidence: row.confidence,
  }))
}

/**
 * Compare forecast accuracy
 */
export async function evaluateForecastAccuracy(
  tourId: number,
  startDate: Date,
  endDate: Date
): Promise<{ mape: number; rmse: number; dataPoints: number }> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const result = await db.execute(sql`
    SELECT
      AVG(ABS(f.predicted_bookings - h.bookings_count) / NULLIF(h.bookings_count, 0)) * 100 as mape,
      SQRT(AVG(POWER(f.predicted_bookings - h.bookings_count, 2))) as rmse,
      COUNT(*) as data_points
    FROM demand_forecasts f
    JOIN booking_history h ON h.tour_id = f.tour_id AND h.date = f.forecast_date
    WHERE f.tour_id = ${tourId}
      AND f.forecast_date BETWEEN ${startDate} AND ${endDate}
      AND h.bookings_count > 0
  `)

  const row = result.rows[0] as any
  return {
    mape: row.mape || 0,
    rmse: row.rmse || 0,
    dataPoints: row.data_points || 0,
  }
}

async function storeForecast(
  tourId: number,
  forecasts: ForecastResult[],
  modelType: string,
  features: Record<string, boolean>
): Promise<void> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle
  const generatedAt = new Date()

  for (const forecast of forecasts) {
    await db.execute(sql`
      INSERT INTO demand_forecasts (
        tour_id, forecast_date, generated_at, model_type,
        predicted_bookings, confidence_lower, confidence_upper,
        confidence_level, features_used
      ) VALUES (
        ${tourId}, ${forecast.date}, ${generatedAt}, ${modelType},
        ${forecast.predicted}, ${forecast.lower}, ${forecast.upper},
        ${forecast.confidence}, ${JSON.stringify(features)}::jsonb
      )
      ON CONFLICT (tour_id, forecast_date, generated_at) DO NOTHING
    `)
  }
}

function generateEmptyForecast(days: number): ForecastResult[] {
  const results: ForecastResult[] = []
  const today = new Date()

  for (let i = 1; i <= days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    results.push({
      date,
      predicted: 0,
      lower: 0,
      upper: 0,
      confidence: 0,
    })
  }

  return results
}
```

### Step 2: Create Moving Average Model

```typescript
// apps/web/lib/forecasting/models/moving-average.ts
import { ForecastResult } from '../forecast-service'

interface HistoricalData {
  date: string
  bookings_count: number
}

/**
 * Simple Moving Average forecasting
 * Used when <30 days of data available
 */
export async function movingAverage(
  history: HistoricalData[],
  horizonDays: number,
  windowSize: number = 7
): Promise<ForecastResult[]> {
  const bookings = history.map((h) => h.bookings_count)

  // Calculate moving average
  const recentData = bookings.slice(-windowSize)
  const avgBookings = recentData.reduce((a, b) => a + b, 0) / recentData.length

  // Calculate standard deviation for confidence intervals
  const variance = recentData.reduce((sum, val) =>
    sum + Math.pow(val - avgBookings, 2), 0
  ) / recentData.length
  const stdDev = Math.sqrt(variance)

  // Generate forecasts
  const forecasts: ForecastResult[] = []
  const today = new Date()

  for (let i = 1; i <= horizonDays; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)

    // Apply day-of-week adjustment if we have enough data
    let dayFactor = 1.0
    if (history.length >= 14) {
      dayFactor = calculateDayOfWeekFactor(history, date.getDay())
    }

    const predicted = avgBookings * dayFactor

    forecasts.push({
      date,
      predicted: Math.max(0, Math.round(predicted * 10) / 10),
      lower: Math.max(0, predicted - 1.96 * stdDev),
      upper: predicted + 1.96 * stdDev,
      confidence: 0.5,  // Low confidence for simple model
    })
  }

  return forecasts
}

function calculateDayOfWeekFactor(
  history: HistoricalData[],
  targetDay: number
): number {
  const dayTotals: Record<number, { sum: number; count: number }> = {}

  for (const h of history) {
    const day = new Date(h.date).getDay()
    if (!dayTotals[day]) {
      dayTotals[day] = { sum: 0, count: 0 }
    }
    dayTotals[day].sum += h.bookings_count
    dayTotals[day].count++
  }

  const overallAvg = history.reduce((s, h) => s + h.bookings_count, 0) / history.length
  const targetDayData = dayTotals[targetDay]

  if (!targetDayData || targetDayData.count === 0 || overallAvg === 0) {
    return 1.0
  }

  const targetAvg = targetDayData.sum / targetDayData.count
  return targetAvg / overallAvg
}
```

### Step 3: Create Exponential Smoothing Model

```typescript
// apps/web/lib/forecasting/models/exponential-smoothing.ts
import { ForecastResult } from '../forecast-service'
import { TimeSeriesFeatures } from '../feature-engineering'

interface HistoricalData {
  date: string
  bookings_count: number
}

/**
 * Holt-Winters Exponential Smoothing
 * Handles trend and seasonality
 */
export async function exponentialSmoothing(
  history: HistoricalData[],
  horizonDays: number,
  features: TimeSeriesFeatures
): Promise<ForecastResult[]> {
  const values = history.map((h) => h.bookings_count)
  const n = values.length

  // Holt-Winters parameters
  const alpha = 0.3  // Level smoothing
  const beta = 0.1   // Trend smoothing
  const gamma = 0.2  // Seasonal smoothing
  const seasonLength = 7  // Weekly seasonality

  // Initialize components
  const level: number[] = []
  const trend: number[] = []
  const seasonal: number[] = new Array(seasonLength).fill(1)

  // Calculate initial seasonal indices
  if (n >= seasonLength * 2) {
    for (let i = 0; i < seasonLength; i++) {
      let sum = 0
      let count = 0
      for (let j = i; j < n; j += seasonLength) {
        const weekAvg = values.slice(j, j + seasonLength)
          .reduce((a, b) => a + b, 0) / seasonLength
        if (weekAvg > 0) {
          sum += values[j] / weekAvg
          count++
        }
      }
      seasonal[i] = count > 0 ? sum / count : 1
    }
  }

  // Initialize level and trend
  level[0] = values[0]
  trend[0] = (values[Math.min(seasonLength, n - 1)] - values[0]) / seasonLength

  // Apply Holt-Winters algorithm
  for (let t = 1; t < n; t++) {
    const seasonIdx = t % seasonLength

    level[t] = alpha * (values[t] / seasonal[seasonIdx]) +
               (1 - alpha) * (level[t - 1] + trend[t - 1])

    trend[t] = beta * (level[t] - level[t - 1]) +
               (1 - beta) * trend[t - 1]

    seasonal[seasonIdx] = gamma * (values[t] / level[t]) +
                          (1 - gamma) * seasonal[seasonIdx]
  }

  // Calculate residual standard error
  const fitted: number[] = []
  for (let t = 0; t < n; t++) {
    const seasonIdx = t % seasonLength
    fitted[t] = (level[t] + trend[t]) * seasonal[seasonIdx]
  }

  const residuals = values.map((v, i) => v - fitted[i])
  const sse = residuals.reduce((sum, r) => sum + r * r, 0)
  const stdError = Math.sqrt(sse / (n - 3))

  // Generate forecasts
  const forecasts: ForecastResult[] = []
  const today = new Date()
  const lastLevel = level[n - 1]
  const lastTrend = trend[n - 1]

  for (let h = 1; h <= horizonDays; h++) {
    const date = new Date(today)
    date.setDate(date.getDate() + h)

    const seasonIdx = (n + h - 1) % seasonLength
    const predicted = (lastLevel + h * lastTrend) * seasonal[seasonIdx]

    // Wider intervals for further forecasts
    const forecastStdError = stdError * Math.sqrt(1 + h * 0.1)

    forecasts.push({
      date,
      predicted: Math.max(0, Math.round(predicted * 10) / 10),
      lower: Math.max(0, predicted - 1.96 * forecastStdError),
      upper: predicted + 1.96 * forecastStdError,
      confidence: Math.max(0.5, 0.8 - h * 0.01),  // Decreasing confidence
    })
  }

  return forecasts
}
```

### Step 4: Create Alert Service

```typescript
// apps/web/lib/forecasting/alert-service.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getForecast } from './forecast-service'

export interface DemandAlert {
  id: number
  tourId: number
  alertType: 'high_demand' | 'low_demand' | 'anomaly'
  alertDate: Date
  severity: 'low' | 'medium' | 'high'
  message: string
  predictedValue: number
  thresholdValue: number
}

interface AlertThresholds {
  highDemandMultiplier: number  // Alert if forecast > avg * this
  lowDemandMultiplier: number   // Alert if forecast < avg * this
  anomalyStdDevs: number        // Alert if actual differs by this many std devs
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  highDemandMultiplier: 1.5,
  lowDemandMultiplier: 0.5,
  anomalyStdDevs: 2.5,
}

/**
 * Generate alerts based on forecasts
 */
export async function generateAlerts(
  tourId: number,
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): Promise<DemandAlert[]> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // Get historical average
  const avgResult = await db.execute(sql`
    SELECT
      AVG(bookings_count) as avg_bookings,
      STDDEV(bookings_count) as std_bookings
    FROM booking_history
    WHERE tour_id = ${tourId}
      AND date > NOW() - INTERVAL '90 days'
  `)

  const stats = avgResult.rows[0] as any
  const avgBookings = stats.avg_bookings || 0
  const stdBookings = stats.std_bookings || 1

  // Get forecasts for next 30 days
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 30)

  const forecasts = await getForecast(tourId, startDate, endDate)

  const alerts: DemandAlert[] = []

  for (const forecast of forecasts) {
    // Check high demand
    if (forecast.predicted > avgBookings * thresholds.highDemandMultiplier) {
      const severity = forecast.predicted > avgBookings * 2 ? 'high' :
                       forecast.predicted > avgBookings * 1.7 ? 'medium' : 'low'

      alerts.push({
        id: 0,  // Will be set when stored
        tourId,
        alertType: 'high_demand',
        alertDate: forecast.date,
        severity,
        message: `Expected ${forecast.predicted.toFixed(1)} bookings (${Math.round((forecast.predicted / avgBookings - 1) * 100)}% above average)`,
        predictedValue: forecast.predicted,
        thresholdValue: avgBookings * thresholds.highDemandMultiplier,
      })
    }

    // Check low demand
    if (forecast.predicted < avgBookings * thresholds.lowDemandMultiplier && avgBookings > 0) {
      const severity = forecast.predicted < avgBookings * 0.3 ? 'high' :
                       forecast.predicted < avgBookings * 0.4 ? 'medium' : 'low'

      alerts.push({
        id: 0,
        tourId,
        alertType: 'low_demand',
        alertDate: forecast.date,
        severity,
        message: `Expected only ${forecast.predicted.toFixed(1)} bookings (${Math.round((1 - forecast.predicted / avgBookings) * 100)}% below average)`,
        predictedValue: forecast.predicted,
        thresholdValue: avgBookings * thresholds.lowDemandMultiplier,
      })
    }
  }

  // Store alerts
  for (const alert of alerts) {
    const result = await db.execute(sql`
      INSERT INTO demand_alerts (
        tour_id, alert_type, alert_date, severity,
        message, predicted_value, threshold_value
      ) VALUES (
        ${alert.tourId}, ${alert.alertType}, ${alert.alertDate}, ${alert.severity},
        ${alert.message}, ${alert.predictedValue}, ${alert.thresholdValue}
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `)
    if (result.rows[0]) {
      alert.id = (result.rows[0] as any).id
    }
  }

  return alerts
}

/**
 * Get pending alerts for admin dashboard
 */
export async function getPendingAlerts(
  tourId?: number,
  limit: number = 50
): Promise<DemandAlert[]> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const result = await db.execute(sql`
    SELECT *
    FROM demand_alerts
    WHERE acknowledged = false
      AND alert_date >= CURRENT_DATE
      ${tourId ? sql`AND tour_id = ${tourId}` : sql``}
    ORDER BY severity DESC, alert_date ASC
    LIMIT ${limit}
  `)

  return result.rows.map((row: any) => ({
    id: row.id,
    tourId: row.tour_id,
    alertType: row.alert_type,
    alertDate: new Date(row.alert_date),
    severity: row.severity,
    message: row.message,
    predictedValue: row.predicted_value,
    thresholdValue: row.threshold_value,
  }))
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(
  alertId: number,
  userId: number
): Promise<void> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  await db.execute(sql`
    UPDATE demand_alerts
    SET acknowledged = true, acknowledged_by = ${userId}, acknowledged_at = NOW()
    WHERE id = ${alertId}
  `)
}

/**
 * Detect anomalies in recent actuals vs forecasts
 */
export async function detectAnomalies(
  tourId: number,
  lookbackDays: number = 7
): Promise<DemandAlert[]> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const result = await db.execute(sql`
    SELECT
      h.date,
      h.bookings_count as actual,
      f.predicted_bookings as predicted,
      f.confidence_upper,
      f.confidence_lower
    FROM booking_history h
    JOIN demand_forecasts f ON f.tour_id = h.tour_id AND f.forecast_date = h.date
    WHERE h.tour_id = ${tourId}
      AND h.date >= CURRENT_DATE - ${lookbackDays}
      AND (h.bookings_count > f.confidence_upper OR h.bookings_count < f.confidence_lower)
  `)

  return result.rows.map((row: any) => ({
    id: 0,
    tourId,
    alertType: 'anomaly' as const,
    alertDate: new Date(row.date),
    severity: 'medium' as const,
    message: `Actual bookings (${row.actual}) outside forecast range (${row.confidence_lower.toFixed(1)}-${row.confidence_upper.toFixed(1)})`,
    predictedValue: row.predicted,
    thresholdValue: row.actual > row.predicted ? row.confidence_upper : row.confidence_lower,
  }))
}
```

### Step 5: Create Forecast API

```typescript
// apps/web/app/api/forecasting/predict/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateForecast, getForecast, evaluateForecastAccuracy } from '@/lib/forecasting/forecast-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const tourId = parseInt(searchParams.get('tourId') || '')
  const horizon = parseInt(searchParams.get('horizon') || '30')
  const refresh = searchParams.get('refresh') === 'true'

  if (!tourId || isNaN(tourId)) {
    return NextResponse.json({ error: 'tourId required' }, { status: 400 })
  }

  try {
    let forecasts

    if (refresh) {
      // Generate new forecast
      forecasts = await generateForecast({
        tourId,
        horizonDays: Math.min(horizon, 90),
      })
    } else {
      // Get existing forecast
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + horizon)

      forecasts = await getForecast(tourId, startDate, endDate)

      // Generate if no existing forecast
      if (forecasts.length === 0) {
        forecasts = await generateForecast({
          tourId,
          horizonDays: Math.min(horizon, 90),
        })
      }
    }

    // Get accuracy metrics
    const accuracy = await evaluateForecastAccuracy(
      tourId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    )

    return NextResponse.json({
      tourId,
      forecasts,
      accuracy,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Forecast API]', error)
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    )
  }
}
```

## Todo List

- [ ] Create database migration for forecasting tables
- [ ] Implement forecast-service.ts
- [ ] Implement moving-average.ts model
- [ ] Implement exponential-smoothing.ts model
- [ ] Create prophet-wrapper.ts (optional Python integration)
- [ ] Implement feature-engineering.ts
- [ ] Implement alert-service.ts
- [ ] Create /api/forecasting/predict endpoint
- [ ] Create /api/forecasting/alerts endpoint
- [ ] Create external-events collection in CMS
- [ ] Build forecast chart component for admin
- [ ] Add demand alerts dashboard widget
- [ ] Create daily forecast cron job
- [ ] Integrate forecasts with pricing engine
- [ ] Add email notifications for high-severity alerts
- [ ] Seed Swedish holidays as external events

## Success Criteria

- [ ] Forecasts generated for all active tours
- [ ] MAPE <30% after 6 months of data
- [ ] Alerts surfaced in admin dashboard
- [ ] Forecasts update daily via cron
- [ ] Historical accuracy tracking working
- [ ] <5s forecast generation time

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Insufficient data | High initially | High | Fallback to simple models |
| Poor accuracy | Medium | Medium | Multiple models, ensemble |
| Alert fatigue | Medium | Low | Configurable thresholds |
| External shocks | Low | High | Anomaly detection, manual override |
| Compute costs | Low | Low | Batch processing, caching |

## Security Considerations

1. **Admin-only access**: Forecasting APIs require authentication
2. **No customer data**: Only aggregate booking counts
3. **Rate limiting**: Prevent abuse of forecast generation
4. **Audit logging**: Track who viewed/generated forecasts
5. **Data retention**: Configurable historical data window

## Next Steps

After Phase 08 completion:
1. **Prophet Integration**: Python service for advanced models
2. **Ensemble Models**: Combine multiple forecasters
3. **External Data**: Weather API integration
4. **Automated Actions**: Auto-adjust marketing based on forecasts

---

**Unresolved Questions:**

1. Python service for Prophet or pure TypeScript implementation?
2. How to handle new tours with no history?
3. Should forecasts be tour-specific or aggregate-level?
4. Notification channels for alerts (email, Slack, in-app)?
