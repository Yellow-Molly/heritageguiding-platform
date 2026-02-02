---
title: "AI-First Platform Transformation"
description: "Transform HeritageGuiding into an AI-first tourism platform with semantic search, content generation, and personalization"
status: pending
priority: P1
effort: 144-180h (10-14 weeks)
branch: master
tags: [ai, pgvector, embeddings, llm, recommendations, personalization, pricing, forecasting, knowledge-graph]
created: 2026-02-02
---

# AI-First Platform Transformation Plan

## Overview

Transform HeritageGuiding from a traditional CMS-driven tourism platform into an AI-first application with semantic search, intelligent content generation, personalized recommendations, and domain-specific LLM capabilities.

## Technology Stack (AI Additions)

- **Vector DB:** pgvector (PostgreSQL extension - leverage existing DB)
- **Embeddings:** OpenAI text-embedding-3-small (1536 dimensions, $0.02/1M tokens)
- **LLM:** Anthropic Claude 3.5 Sonnet (primary), OpenAI GPT-4o (fallback)
- **AI SDK:** Vercel AI SDK 4.x (streaming, React hooks)
- **Analytics:** PostHog (user tracking, feature flags, A/B testing)

## Phase Overview

| Phase | Name | Effort | Priority | File |
|-------|------|--------|----------|------|
| 01 | Semantic Search Foundation | 16-20h | P1 | [phase-01](./phase-01-semantic-search-foundation.md) |
| 02 | AI Content Generation | 12-16h | P2 | [phase-02](./phase-02-ai-content-generation.md) |
| 03 | Recommendation Engine | 16-20h | P2 | [phase-03](./phase-03-recommendation-engine.md) |
| 04 | Analytics & Personalization | 16-20h | P2 | [phase-04](./phase-04-analytics-personalization.md) |
| 05 | Domain-Specific LLM | 20-24h | P3 | [phase-05](./phase-05-domain-specific-llm.md) |
| 06 | Dynamic Pricing | 12-16h | P3 | [phase-06](./phase-06-dynamic-pricing.md) |
| 07 | Knowledge Graph | 16-20h | P3 | [phase-07](./phase-07-knowledge-graph.md) |
| 08 | Demand Forecasting | 16-20h | P3 | [phase-08](./phase-08-demand-forecasting.md) |
| 09 | Autonomous Itinerary Generation | 20-24h | P3 | [phase-09](./phase-09-autonomous-itinerary-generation.md) |

## Key Dependencies

- PostgreSQL 15+ (existing - pgvector compatible)
- OpenAI API key for embeddings
- Anthropic API key for LLM
- PostHog account for analytics
- Existing tour data (10+ tours minimum)

## Success Criteria

- Semantic search returns relevant tours (>85% user satisfaction)
- AI content generation reduces manual work by 60%
- Personalized recommendations increase booking conversion by 20%
- Domain LLM answers heritage questions accurately (>90%)
- Lighthouse scores maintained at 90+
- Dynamic pricing suggestions within 15% of manual prices
- Demand forecasts MAPE <30% after 6 months data
- Knowledge graph enables complex entity queries <500ms
- Itinerary generation completes in <10s

## Architecture Evolution

```
Current:                          AI-First:

User -> Next.js -> PostgreSQL     User -> Next.js -> AI Layer -> PostgreSQL
                                                  \-> pgvector
                                                  \-> LLM APIs
                                                  \-> Knowledge Graph
                                                  \-> Forecasting Engine
```

## Phase Dependencies

```
Phase 01 (Semantic Search) ─┬─> Phase 02 (Content Gen)
                            ├─> Phase 03 (Recommendations) ─> Phase 04 (Personalization)
                            ├─> Phase 05 (Domain LLM)
                            └─> Phase 07 (Knowledge Graph)

Phase 03 + 04 ─> Phase 06 (Dynamic Pricing)
Phase 03 + 04 ─> Phase 08 (Demand Forecasting)
Phase 01 + 03 + 07 ─> Phase 09 (Itinerary Generation)
```

---

**Prerequisite:** Fix 5 Bokun security issues before AI implementation.
**Blockers:** None (can proceed in parallel with existing MVP phases).
