# AI-First Platform - External Service Operational Costs

## Overview

Detailed cost analysis for external APIs and services required to run the AI-first features.

---

## 1. OpenAI API (Embeddings)

**Used in:** Phase 01, 03, 07

**Model:** `text-embedding-3-small` @ $0.02/1M tokens

### Usage Estimates

```
Operation                    Tokens/Req    Monthly Tokens    Cost
─────────────────────────────────────────────────────────────────
Tour embedding               ~500          15,000            $0.00
Search query embedding       ~50           750,000           $0.02
FAQ/Knowledge embedding      ~300          90,000            $0.00
User profile embedding       ~200          600,000           $0.01
─────────────────────────────────────────────────────────────────
TOTAL                                      ~1.5M             ~$0.03
```

### Traffic-Based Estimates

```
Low traffic:                 $0.05 - $0.50/month
Medium traffic (1K users):   $1 - $5/month
High traffic (10K users):    $5 - $20/month
```

---

## 2. Anthropic Claude API (MAIN COST DRIVER)

**Used in:** Phase 02, 05, 09

**Model:** Claude 3.5 Sonnet @ $3/1M input, $15/1M output

### Phase 02: Content Generation (~$0.50/month)

```
Tour descriptions:     20/month × 1K tokens = $0.18
SEO metadata:          20/month × 600 tokens = $0.08
Social media copy:     30/month × 700 tokens = $0.17
```

### Phase 05: Chatbot (70-80% of total costs)

```
Daily Chats    Input Tokens    Output Tokens    Monthly Cost
────────────────────────────────────────────────────────────
50             2,000           400              $12
100            2,000           400              $24
200            2,000           400              $50
500            2,000           400              $120
1,000          2,000           400              $240
```

### Phase 09: Itinerary Enhancement (~$1/month)

```
Day descriptions: 100 itineraries × 5 days × 800 tokens = $0.60
```

### Claude Monthly Summary

```
Usage Level      Daily Chats    Monthly Cost
──────────────────────────────────────────────
Low              50             $12 - $15
Medium           200            $50 - $60
High             500            $120 - $150
Very High        1,000          $240 - $300
```

---

## 3. PostHog Analytics

**Used in:** Phase 04

**Pricing:** FREE up to 1M events/month

### Event Estimates (500 daily users)

```
Page views:           75,000/month
Tour interactions:    45,000/month
Search events:        30,000/month
Booking funnel:       3,000/month
────────────────────────────────────
TOTAL:                ~150,000/month (FREE TIER)
```

---

## 4. Database (pgvector)

**Cost:** $0 (uses existing PostgreSQL)

```
Storage Estimate:
  Tour embeddings:    1.8 MB (100 tours × 3 locales × 6KB)
  FAQ embeddings:     1.2 MB
  User profiles:      60 MB (10K users)
  Knowledge graph:    1 MB
  ───────────────────────────
  TOTAL:              ~65 MB
```

---

## 5. Optional Services

```
Service                  Phase    Cost
─────────────────────────────────────────────
Weather API              08       FREE (1K calls/day)
Google Calendar API      09       FREE
Google Maps Directions   09       ~$2.50/month (500 requests)
```

---

## Monthly Cost Summary

### By Service

```
Service              Low        Medium      High
─────────────────────────────────────────────────
OpenAI Embeddings    $0.05      $2          $20
Anthropic Claude     $15        $60         $150
PostHog              $0         $0          $0*
Google Maps          $0         $2.50       $10
Weather API          $0         $0          $0
─────────────────────────────────────────────────
TOTAL                $15        $65         $180

* Free tier: under 1M events/month
```

### By Phase

```
Phase                        Service         Monthly Cost
──────────────────────────────────────────────────────────
01: Semantic Search          OpenAI          $0.50 - $5
02: Content Generation       Claude          $0.50 - $5
03: Recommendations          OpenAI          $1 - $10
04: Analytics                PostHog         $0 (free)
05: Domain LLM Chatbot       Claude          $15 - $150  ← MAIN COST
06: Dynamic Pricing          None            $0
07: Knowledge Graph          OpenAI          $0.50 - $2
08: Demand Forecasting       None            $0
09: Itinerary Generation     Claude + Maps   $2 - $15
```

---

## Budget Scenarios

```
Scenario          Description                    Monthly     Annual
────────────────────────────────────────────────────────────────────
Minimal           Phase 01 only, low traffic     $5-10       $120
Standard          Phases 01-04, medium traffic   $30-50      $600
Full Platform     All phases, medium traffic     $60-100     $960
High Traffic      All phases, 1K+ daily users    $150-250    $2,400
```

---

## Cost Optimization Strategies

### 1. Reduce Claude Costs (Biggest Impact)

- Cache frequent chatbot responses → Save $20-50/month
- Use shorter system prompts → Reduce input tokens 30%
- Use Haiku for simple queries → 10x cheaper ($0.25/$1.25 per 1M)
- Rate limit: 20 messages/session max

### 2. Reduce Embedding Costs

- Cache common search query embeddings
- Use 512 dimensions instead of 1536 → 50% savings
- Batch nightly updates instead of real-time

### 3. Avoid Unnecessary API Calls

- Content hash check → Only re-embed changed content
- Local caching (Redis/memory) for hot data
- Debounce search → Wait 300ms before embedding

---

## Key Takeaway

**Phase 05 Chatbot = 70-80% of costs**

Best optimizations:
1. Cache common questions
2. Use Haiku for routing, Sonnet for complex queries
3. Limit RAG context window size
4. Implement response caching

---

*Last updated: 2026-02-03*
