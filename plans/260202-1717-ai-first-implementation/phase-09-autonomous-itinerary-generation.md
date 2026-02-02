# Phase 09: Autonomous Itinerary Generation

## Context Links

- [Phase 01 - Semantic Search](./phase-01-semantic-search-foundation.md) - Tour embeddings
- [Phase 03 - Recommendation Engine](./phase-03-recommendation-engine.md) - Personalization
- [Phase 05 - Domain-Specific LLM](./phase-05-domain-specific-llm.md) - AI assistant
- [Phase 07 - Knowledge Graph](./phase-07-knowledge-graph.md) - Entity relationships
- [Tours Collection](../../packages/cms/collections/tours.ts)
- [Google Calendar API](https://developers.google.com/calendar)
- [PDF Generation (jsPDF)](https://github.com/parallax/jsPDF)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P3 - Medium | pending | 20-24h |

Build an AI-powered itinerary generator that creates custom multi-tour travel plans based on user inputs (dates, interests, budget, group size). Consider logistics like locations, timing, and walking distance. Export itineraries to PDF or calendar formats.

## Key Insights

1. **Constraint satisfaction**: Itineraries must respect time, budget, and distance constraints
2. **Tour compatibility**: Some tours conflict (same time/location), others complement
3. **Optimization goal**: Maximize interest match while minimizing travel time
4. **User preferences**: Balance must-see attractions with hidden gems
5. **Flexibility**: Allow manual adjustments after AI generation

## Requirements

### Functional

- Accept inputs: dates, interests, budget, group size, mobility constraints
- Generate multi-day itineraries with 1-4 tours per day
- Consider tour locations and travel time between them
- Respect tour schedules and availability
- Suggest meal breaks and rest periods
- Allow manual editing of generated itineraries
- Export to PDF with maps and details
- Export to Google Calendar / iCal
- Save itineraries to user account (optional)
- Share itineraries via unique link

### Non-Functional

- Generation time <10s for 7-day itinerary
- Handle 100+ concurrent generations
- PDF export <5s
- Mobile-responsive itinerary view
- Offline PDF access
- SEO-friendly shareable links
- WCAG 2.1 AA compliance

## Architecture

### Itinerary Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                  Itinerary Generation Pipeline                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USER INPUTS                                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Dates          Interests       Budget        Constraints   │ │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────────┐ │ │
│  │  │ Start    │  │ History   │  │ Min/Max  │  │ Group size │ │ │
│  │  │ End      │  │ Food      │  │ Per day  │  │ Mobility   │ │ │
│  │  │ Flexible │  │ Art       │  │ Total    │  │ Kids       │ │ │
│  │  └──────────┘  │ Nature    │  └──────────┘  │ Languages  │ │ │
│  │                └───────────┘                └────────────┘ │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  TOUR SELECTION                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  1. Filter by constraints (budget, accessibility, language) │ │
│  │  2. Score by interest match (embeddings similarity)         │ │
│  │  3. Consider availability for requested dates               │ │
│  │  4. Rank candidates (top 20-30 tours)                       │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  SCHEDULING OPTIMIZATION                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Constraints:                                                │ │
│  │  - Tours don't overlap in time                              │ │
│  │  - Travel time between tours is reasonable (<30 min)        │ │
│  │  - Daily budget not exceeded                                │ │
│  │  - Morning/afternoon preferences respected                  │ │
│  │  - Rest periods included (lunch, breaks)                    │ │
│  │                                                              │ │
│  │  Algorithm: Greedy with backtracking                        │ │
│  │  1. For each day, place highest-scored tour                 │ │
│  │  2. Fill remaining slots with compatible tours              │ │
│  │  3. Backtrack if constraints violated                       │ │
│  │  4. Add travel/rest segments                                │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  LLM ENHANCEMENT                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  - Generate personalized day descriptions                   │ │
│  │  - Suggest meal recommendations near tour locations         │ │
│  │  - Add local tips and hidden gems                           │ │
│  │  - Create narrative flow between tours                      │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                            │                                     │
│                            ▼                                     │
│  OUTPUT                                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                              │ │
│  │  Itinerary Object      PDF Export      Calendar Export      │ │
│  │  ┌─────────────────┐  ┌────────────┐  ┌─────────────────┐  │ │
│  │  │ - Days[]        │  │ - Cover    │  │ - .ics file     │  │ │
│  │  │ - Tours[]       │  │ - Schedule │  │ - Google Cal    │  │ │
│  │  │ - Travel[]      │  │ - Maps     │  │ - Outlook       │  │ │
│  │  │ - Tips[]        │  │ - Details  │  │                 │  │ │
│  │  │ - TotalCost     │  │ - QR codes │  │                 │  │ │
│  │  └─────────────────┘  └────────────┘  └─────────────────┘  │ │
│  │                                                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Generated itineraries
CREATE TABLE itineraries (
  id SERIAL PRIMARY KEY,
  share_id TEXT UNIQUE NOT NULL,  -- Public sharing ID
  user_id INTEGER REFERENCES users(id),  -- Optional authenticated user
  session_id TEXT,  -- Anonymous session
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  preferences JSONB NOT NULL,  -- User inputs
  generated_at TIMESTAMP DEFAULT NOW(),
  total_cost DECIMAL(10,2),
  total_duration_hours FLOAT,
  status TEXT DEFAULT 'draft',  -- 'draft', 'confirmed', 'completed'
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_itineraries_share ON itineraries(share_id);
CREATE INDEX idx_itineraries_user ON itineraries(user_id);

-- Itinerary days
CREATE TABLE itinerary_days (
  id SERIAL PRIMARY KEY,
  itinerary_id INTEGER REFERENCES itineraries(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  title TEXT,  -- AI-generated day title
  description TEXT,  -- AI-generated summary
  total_cost DECIMAL(10,2),
  UNIQUE(itinerary_id, day_number)
);

-- Itinerary items (tours, breaks, travel)
CREATE TABLE itinerary_items (
  id SERIAL PRIMARY KEY,
  day_id INTEGER REFERENCES itinerary_days(id) ON DELETE CASCADE,
  item_order INTEGER NOT NULL,
  item_type TEXT NOT NULL,  -- 'tour', 'meal', 'travel', 'rest', 'free_time'
  tour_id INTEGER REFERENCES tours(id),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  cost DECIMAL(10,2) DEFAULT 0,
  notes TEXT,  -- AI tips
  UNIQUE(day_id, item_order)
);

-- Saved itinerary templates (for re-use)
CREATE TABLE itinerary_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  preferences JSONB NOT NULL,
  items_config JSONB NOT NULL,  -- Template structure
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Related Code Files

### Create

| File | Purpose |
|------|---------|
| `apps/web/lib/itinerary/itinerary-generator.ts` | Core generation logic |
| `apps/web/lib/itinerary/tour-selector.ts` | Tour filtering/scoring |
| `apps/web/lib/itinerary/schedule-optimizer.ts` | Time slot optimization |
| `apps/web/lib/itinerary/travel-calculator.ts` | Distance/time calculations |
| `apps/web/lib/itinerary/llm-enhancer.ts` | AI descriptions |
| `apps/web/lib/itinerary/pdf-exporter.ts` | PDF generation |
| `apps/web/lib/itinerary/calendar-exporter.ts` | iCal/Google export |
| `apps/web/app/api/itinerary/generate/route.ts` | Generation API |
| `apps/web/app/api/itinerary/[id]/route.ts` | CRUD operations |
| `apps/web/app/api/itinerary/[id]/pdf/route.ts` | PDF download |
| `apps/web/app/api/itinerary/[id]/calendar/route.ts` | Calendar export |
| `apps/web/app/[locale]/(frontend)/itinerary/page.tsx` | Generator UI |
| `apps/web/app/[locale]/(frontend)/itinerary/[shareId]/page.tsx` | View itinerary |
| `apps/web/components/itinerary/itinerary-wizard.tsx` | Multi-step form |
| `apps/web/components/itinerary/itinerary-view.tsx` | Itinerary display |
| `apps/web/components/itinerary/day-timeline.tsx` | Day schedule |
| `apps/web/components/itinerary/export-buttons.tsx` | Export options |
| `packages/cms/migrations/add-itinerary-tables.ts` | Database migration |

### Modify

| File | Change |
|------|--------|
| `apps/web/messages/en.json` | Add itinerary translations |
| `apps/web/messages/sv.json` | Add itinerary translations |
| `packages/cms/collections/tours.ts` | Add location coordinates |

## Implementation Steps

### Step 1: Create Tour Selector

```typescript
// apps/web/lib/itinerary/tour-selector.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateEmbedding } from '../ai/embeddings-service'

export interface TourCandidate {
  tourId: number
  title: string
  slug: string
  price: number
  durationHours: number
  startTimes: string[]  // Available start times
  location: { lat: number; lng: number }
  score: number
  matchedInterests: string[]
}

export interface SelectionCriteria {
  interests: string[]
  budgetPerDay: number
  groupSize: number
  accessibility: boolean
  languages: string[]
  dates: Date[]
}

/**
 * Select candidate tours matching user criteria
 */
export async function selectTourCandidates(
  criteria: SelectionCriteria,
  limit: number = 30
): Promise<TourCandidate[]> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // Generate embedding for user interests
  const interestsText = criteria.interests.join(', ')
  const interestsEmbedding = await generateEmbedding(interestsText)
  const embeddingString = `[${interestsEmbedding.join(',')}]`

  // Query tours with filters
  const results = await db.execute(sql`
    SELECT
      t.id as tour_id,
      t.title,
      t.slug,
      t.pricing_base_price as price,
      t.duration_hours,
      t.start_times,
      t.meeting_point_lat as lat,
      t.meeting_point_lng as lng,
      1 - (te.embedding <=> ${embeddingString}::vector) as similarity,
      array_agg(DISTINCT c.name) as categories
    FROM tours t
    JOIN tour_embeddings te ON te.tour_id = t.id AND te.locale = 'en'
    LEFT JOIN tours_categories tc ON tc.tour_id = t.id
    LEFT JOIN categories c ON c.id = tc.category_id
    WHERE t.status = 'published'
      AND t.pricing_base_price <= ${criteria.budgetPerDay}
      AND t.max_group_size >= ${criteria.groupSize}
      ${criteria.accessibility ? sql`AND t.accessibility = true` : sql``}
    GROUP BY t.id, te.embedding
    ORDER BY similarity DESC
    LIMIT ${limit}
  `)

  return results.rows.map((row: any) => ({
    tourId: row.tour_id,
    title: row.title,
    slug: row.slug,
    price: row.price,
    durationHours: row.duration_hours,
    startTimes: row.start_times || ['09:00', '14:00'],
    location: { lat: row.lat || 59.329, lng: row.lng || 18.068 },
    score: row.similarity,
    matchedInterests: (row.categories || []).filter((c: string) =>
      criteria.interests.some((i) => c.toLowerCase().includes(i.toLowerCase()))
    ),
  }))
}

/**
 * Check tour availability for specific dates
 */
export async function checkTourAvailability(
  tourId: number,
  dates: Date[]
): Promise<Map<string, boolean>> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // Check against bookings/closures
  const availability = new Map<string, boolean>()

  for (const date of dates) {
    const dateStr = date.toISOString().split('T')[0]

    // Check if tour operates on this day of week
    const result = await db.execute(sql`
      SELECT
        t.operating_days,
        NOT EXISTS (
          SELECT 1 FROM tour_closures tc
          WHERE tc.tour_id = ${tourId}
            AND tc.closure_date = ${dateStr}
        ) as available
      FROM tours t
      WHERE t.id = ${tourId}
    `)

    const row = result.rows[0] as any
    if (row) {
      const dayOfWeek = date.getDay()
      const operatingDays = row.operating_days || [0, 1, 2, 3, 4, 5, 6]
      availability.set(dateStr, operatingDays.includes(dayOfWeek) && row.available)
    } else {
      availability.set(dateStr, false)
    }
  }

  return availability
}
```

### Step 2: Create Schedule Optimizer

```typescript
// apps/web/lib/itinerary/schedule-optimizer.ts
import { TourCandidate } from './tour-selector'
import { calculateTravelTime } from './travel-calculator'

export interface ScheduledItem {
  type: 'tour' | 'travel' | 'meal' | 'rest'
  tourId?: number
  title: string
  startTime: string  // HH:mm
  endTime: string
  location?: { lat: number; lng: number }
  cost: number
}

export interface DaySchedule {
  date: Date
  items: ScheduledItem[]
  totalCost: number
  totalHours: number
}

interface ScheduleConstraints {
  dayStartTime: string  // e.g., "09:00"
  dayEndTime: string    // e.g., "21:00"
  lunchWindow: { start: string; end: string }
  maxToursPerDay: number
  maxWalkingMinutes: number
  budgetPerDay: number
}

const DEFAULT_CONSTRAINTS: ScheduleConstraints = {
  dayStartTime: '09:00',
  dayEndTime: '21:00',
  lunchWindow: { start: '12:00', end: '14:00' },
  maxToursPerDay: 3,
  maxWalkingMinutes: 30,
  budgetPerDay: 2000,
}

/**
 * Generate optimized schedule for given dates
 */
export async function optimizeSchedule(
  candidates: TourCandidate[],
  dates: Date[],
  constraints: Partial<ScheduleConstraints> = {}
): Promise<DaySchedule[]> {
  const config = { ...DEFAULT_CONSTRAINTS, ...constraints }
  const schedules: DaySchedule[] = []
  const usedTours = new Set<number>()

  for (const date of dates) {
    const daySchedule = await scheduleSingleDay(
      candidates.filter((c) => !usedTours.has(c.tourId)),
      date,
      config
    )

    // Mark tours as used
    daySchedule.items
      .filter((item) => item.type === 'tour' && item.tourId)
      .forEach((item) => usedTours.add(item.tourId!))

    schedules.push(daySchedule)
  }

  return schedules
}

async function scheduleSingleDay(
  candidates: TourCandidate[],
  date: Date,
  config: ScheduleConstraints
): Promise<DaySchedule> {
  const items: ScheduledItem[] = []
  let currentTime = parseTime(config.dayStartTime)
  let totalCost = 0
  let lastLocation: { lat: number; lng: number } | null = null
  let toursScheduled = 0

  // Sort candidates by score
  const sortedCandidates = [...candidates].sort((a, b) => b.score - a.score)

  for (const candidate of sortedCandidates) {
    if (toursScheduled >= config.maxToursPerDay) break
    if (totalCost + candidate.price > config.budgetPerDay) continue

    // Find next available start time
    const availableStart = findNextSlot(
      currentTime,
      candidate.startTimes,
      candidate.durationHours,
      config
    )

    if (!availableStart) continue

    // Check travel time from last location
    if (lastLocation) {
      const travelMinutes = await calculateTravelTime(
        lastLocation,
        candidate.location
      )

      if (travelMinutes > config.maxWalkingMinutes) continue

      // Add travel segment
      const travelEnd = addMinutes(currentTime, travelMinutes)
      items.push({
        type: 'travel',
        title: 'Walk to next tour',
        startTime: formatTime(currentTime),
        endTime: formatTime(travelEnd),
        cost: 0,
      })
      currentTime = travelEnd
    }

    // Check if lunch break needed
    const lunchStart = parseTime(config.lunchWindow.start)
    const lunchEnd = parseTime(config.lunchWindow.end)

    if (currentTime >= lunchStart && currentTime < lunchEnd && !hasLunch(items)) {
      const lunchDuration = 60
      items.push({
        type: 'meal',
        title: 'Lunch break',
        startTime: formatTime(currentTime),
        endTime: formatTime(addMinutes(currentTime, lunchDuration)),
        cost: 0,  // Not included in tour budget
      })
      currentTime = addMinutes(currentTime, lunchDuration)
    }

    // Schedule the tour
    const tourEnd = addMinutes(availableStart, candidate.durationHours * 60)

    items.push({
      type: 'tour',
      tourId: candidate.tourId,
      title: candidate.title,
      startTime: formatTime(availableStart),
      endTime: formatTime(tourEnd),
      location: candidate.location,
      cost: candidate.price,
    })

    currentTime = tourEnd
    lastLocation = candidate.location
    totalCost += candidate.price
    toursScheduled++
  }

  // Add rest period if there's a long gap
  items.sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))

  return {
    date,
    items,
    totalCost,
    totalHours: (currentTime - parseTime(config.dayStartTime)) / 60,
  }
}

function findNextSlot(
  currentTime: number,
  availableStarts: string[],
  durationHours: number,
  config: ScheduleConstraints
): number | null {
  for (const startStr of availableStarts) {
    const start = parseTime(startStr)
    if (start < currentTime) continue

    const end = addMinutes(start, durationHours * 60)
    if (end > parseTime(config.dayEndTime)) continue

    return start
  }
  return null
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

function addMinutes(time: number, minutes: number): number {
  return time + minutes
}

function hasLunch(items: ScheduledItem[]): boolean {
  return items.some((item) => item.type === 'meal')
}
```

### Step 3: Create Travel Calculator

```typescript
// apps/web/lib/itinerary/travel-calculator.ts

interface Location {
  lat: number
  lng: number
}

// Walking speed in km/h
const WALKING_SPEED = 5

/**
 * Calculate walking time between two locations
 */
export async function calculateTravelTime(
  from: Location,
  to: Location
): Promise<number> {
  const distance = haversineDistance(from, to)
  const timeHours = distance / WALKING_SPEED
  const timeMinutes = Math.ceil(timeHours * 60)

  // Add buffer for traffic lights, navigation
  return Math.ceil(timeMinutes * 1.2)
}

/**
 * Calculate haversine distance in km
 */
function haversineDistance(from: Location, to: Location): number {
  const R = 6371  // Earth's radius in km
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Sort locations to minimize total travel distance
 * Simple nearest-neighbor algorithm
 */
export function optimizeRoute(locations: Location[]): number[] {
  if (locations.length <= 2) {
    return locations.map((_, i) => i)
  }

  const order: number[] = [0]
  const remaining = new Set(locations.map((_, i) => i).slice(1))

  while (remaining.size > 0) {
    const last = locations[order[order.length - 1]]
    let nearest = -1
    let minDistance = Infinity

    for (const idx of remaining) {
      const distance = haversineDistance(last, locations[idx])
      if (distance < minDistance) {
        minDistance = distance
        nearest = idx
      }
    }

    order.push(nearest)
    remaining.delete(nearest)
  }

  return order
}
```

### Step 4: Create LLM Enhancer

```typescript
// apps/web/lib/itinerary/llm-enhancer.ts
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { DaySchedule } from './schedule-optimizer'

export interface EnhancedDay {
  dayNumber: number
  title: string
  description: string
  tips: string[]
  mealSuggestions: string[]
}

/**
 * Generate AI-enhanced descriptions for itinerary days
 */
export async function enhanceItinerary(
  days: DaySchedule[],
  preferences: { interests: string[]; groupSize: number }
): Promise<EnhancedDay[]> {
  const enhancedDays: EnhancedDay[] = []

  for (let i = 0; i < days.length; i++) {
    const day = days[i]
    const tourNames = day.items
      .filter((item) => item.type === 'tour')
      .map((item) => item.title)
      .join(', ')

    const prompt = `Generate a brief travel day description for a Sweden itinerary.

Day ${i + 1}: Tours include ${tourNames || 'free exploration'}
User interests: ${preferences.interests.join(', ')}
Group size: ${preferences.groupSize} people

Provide in JSON format:
{
  "title": "Catchy day title (5-8 words)",
  "description": "2-3 sentence overview of what makes this day special",
  "tips": ["Local tip 1", "Local tip 2"],
  "mealSuggestions": ["Restaurant name near tour locations"]
}

Be specific to Sweden. Keep it concise and engaging.`

    try {
      const result = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        prompt,
        maxTokens: 300,
      })

      const parsed = JSON.parse(result.text)
      enhancedDays.push({
        dayNumber: i + 1,
        title: parsed.title || `Day ${i + 1}`,
        description: parsed.description || '',
        tips: parsed.tips || [],
        mealSuggestions: parsed.mealSuggestions || [],
      })
    } catch (error) {
      console.error('LLM enhancement failed:', error)
      enhancedDays.push({
        dayNumber: i + 1,
        title: `Day ${i + 1}: ${tourNames || 'Explore Sweden'}`,
        description: 'A wonderful day of discovery awaits.',
        tips: [],
        mealSuggestions: [],
      })
    }
  }

  return enhancedDays
}
```

### Step 5: Create PDF Exporter

```typescript
// apps/web/lib/itinerary/pdf-exporter.ts
import jsPDF from 'jspdf'
import { DaySchedule, ScheduledItem } from './schedule-optimizer'
import { EnhancedDay } from './llm-enhancer'

export interface ItineraryPDFData {
  title: string
  dates: { start: Date; end: Date }
  days: DaySchedule[]
  enhancedDays: EnhancedDay[]
  totalCost: number
  shareUrl: string
}

/**
 * Generate PDF itinerary
 */
export async function generatePDF(data: ItineraryPDFData): Promise<Buffer> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  // Title
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text(data.title, pageWidth / 2, y, { align: 'center' })
  y += 15

  // Dates
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  const dateRange = `${formatDate(data.dates.start)} - ${formatDate(data.dates.end)}`
  doc.text(dateRange, pageWidth / 2, y, { align: 'center' })
  y += 10

  // Total cost
  doc.setFontSize(10)
  doc.text(`Total Estimated Cost: ${data.totalCost} SEK`, pageWidth / 2, y, { align: 'center' })
  y += 15

  // Days
  for (let i = 0; i < data.days.length; i++) {
    const day = data.days[i]
    const enhanced = data.enhancedDays[i]

    // Check if new page needed
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    // Day header
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(enhanced.title, 15, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.text(formatDate(day.date), 15, y)
    y += 8

    // Day description
    doc.setFont('helvetica', 'normal')
    const descLines = doc.splitTextToSize(enhanced.description, pageWidth - 30)
    doc.text(descLines, 15, y)
    y += descLines.length * 5 + 5

    // Schedule items
    for (const item of day.items) {
      if (y > 270) {
        doc.addPage()
        y = 20
      }

      const timeStr = `${item.startTime} - ${item.endTime}`
      const icon = getItemIcon(item.type)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${icon} ${timeStr}`, 20, y)

      doc.setFont('helvetica', 'normal')
      doc.text(item.title, 65, y)

      if (item.cost > 0) {
        doc.text(`${item.cost} SEK`, pageWidth - 30, y)
      }

      y += 6
    }

    // Tips
    if (enhanced.tips.length > 0) {
      y += 5
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.text('Tips: ' + enhanced.tips[0], 20, y)
      y += 5
    }

    y += 10
  }

  // Footer with share URL
  doc.setFontSize(8)
  doc.text(`View online: ${data.shareUrl}`, 15, 285)

  return Buffer.from(doc.output('arraybuffer'))
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function getItemIcon(type: string): string {
  switch (type) {
    case 'tour': return '[T]'
    case 'meal': return '[M]'
    case 'travel': return '[W]'
    case 'rest': return '[R]'
    default: return '[-]'
  }
}
```

### Step 6: Create Generation API

```typescript
// apps/web/app/api/itinerary/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { selectTourCandidates, checkTourAvailability } from '@/lib/itinerary/tour-selector'
import { optimizeSchedule } from '@/lib/itinerary/schedule-optimizer'
import { enhanceItinerary } from '@/lib/itinerary/llm-enhancer'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      startDate,
      endDate,
      interests,
      budgetPerDay,
      groupSize,
      accessibility = false,
      languages = ['en'],
    } = body

    // Validate inputs
    if (!startDate || !endDate || !interests?.length) {
      return NextResponse.json(
        { error: 'startDate, endDate, and interests required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const days: Date[] = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }

    if (days.length > 14) {
      return NextResponse.json(
        { error: 'Maximum 14 days supported' },
        { status: 400 }
      )
    }

    // Select candidate tours
    const candidates = await selectTourCandidates({
      interests,
      budgetPerDay: budgetPerDay || 2000,
      groupSize: groupSize || 2,
      accessibility,
      languages,
      dates: days,
    })

    // Generate optimized schedule
    const schedule = await optimizeSchedule(candidates, days, {
      budgetPerDay: budgetPerDay || 2000,
    })

    // Enhance with AI descriptions
    const enhanced = await enhanceItinerary(schedule, {
      interests,
      groupSize: groupSize || 2,
    })

    // Calculate totals
    const totalCost = schedule.reduce((sum, day) => sum + day.totalCost, 0)

    // Generate share ID
    const shareId = nanoid(10)

    // Store itinerary
    const payload = await getPayload({ config })
    const db = payload.db.drizzle

    // ... store in database ...

    return NextResponse.json({
      shareId,
      title: `Sweden ${days.length}-Day Adventure`,
      dates: { start: startDate, end: endDate },
      days: schedule.map((day, i) => ({
        ...day,
        ...enhanced[i],
      })),
      totalCost,
      shareUrl: `${process.env.NEXT_PUBLIC_URL}/itinerary/${shareId}`,
    })
  } catch (error) {
    console.error('[Itinerary Generate]', error)
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 }
    )
  }
}
```

## Todo List

- [ ] Create database migration for itinerary tables
- [ ] Implement tour-selector.ts
- [ ] Implement schedule-optimizer.ts
- [ ] Implement travel-calculator.ts
- [ ] Implement llm-enhancer.ts
- [ ] Implement pdf-exporter.ts
- [ ] Implement calendar-exporter.ts
- [ ] Create /api/itinerary/generate endpoint
- [ ] Create /api/itinerary/[id] CRUD endpoints
- [ ] Create /api/itinerary/[id]/pdf endpoint
- [ ] Create /api/itinerary/[id]/calendar endpoint
- [ ] Build itinerary wizard component
- [ ] Build itinerary view component
- [ ] Build day timeline component
- [ ] Add location coordinates to tours
- [ ] Create shareable itinerary page
- [ ] Add itinerary translations (SV/EN/DE)
- [ ] Implement Google Calendar OAuth
- [ ] Add itinerary editing UI
- [ ] Create itinerary templates for quick start

## Success Criteria

- [ ] Itinerary generated in <10s
- [ ] No time conflicts in schedules
- [ ] Travel time between tours <30 min walk
- [ ] Budget constraints respected
- [ ] PDF export functional
- [ ] Calendar export working
- [ ] Share links accessible publicly
- [ ] Mobile-responsive UI

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| No matching tours | Medium | High | Show alternatives, fewer constraints |
| Poor schedule quality | Medium | Medium | Allow manual editing |
| LLM enhancement slow | Low | Low | Timeout, fallback text |
| PDF generation fails | Low | Medium | Error handling, retry |
| Calendar API limits | Low | Low | Rate limiting, queue |

## Security Considerations

1. **Share link security**: Random IDs, no sensitive data
2. **Rate limiting**: Prevent abuse of generation API
3. **Input validation**: Sanitize all user inputs
4. **OAuth tokens**: Secure storage for calendar integration
5. **No PII in PDFs**: Only itinerary data

## Next Steps

After Phase 09 completion:
1. **Group Itineraries**: Collaborative planning
2. **Real-time Availability**: Check Bokun during generation
3. **Weather Integration**: Adjust for forecasted weather
4. **Price Alerts**: Notify when tour prices drop

---

**Unresolved Questions:**

1. Should itineraries be saved permanently or expire?
2. Collaborative editing for group trips?
3. Integration with booking flow (book entire itinerary)?
4. Offline mobile app for itinerary access?
