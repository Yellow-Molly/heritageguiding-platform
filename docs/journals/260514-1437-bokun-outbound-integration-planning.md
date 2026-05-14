# Bokun Outbound Integration: Planning Session & Discovery

**Date**: 2026-05-14 14:37  
**Severity**: Medium  
**Component**: Bokun API, CMS Tours Collection  
**Status**: Planned (7 tasks created)

## What Happened

Ran brainstorm + planning session to scope automatic syncing of CMS Tour data to Bokun Experiences (outbound only, POST /experience + PATCH /experience endpoints). Scout + Researcher agents ran in parallel. Cross-plan scanning during `/ck:plan` revealed massive existing infrastructure we almost duplicated.

## The Brutal Truth

We almost built a second Bokun client from scratch. Halfway through planning, discovered `apps/web/lib/bokun/` already has HMAC auth client, availability cache, booking service, webhook handler, and unit tests—all from Phase 08.1 (mvp-implementation). That infrastructure is inbound-only (read availability, embed widget, receive webhooks). The new outbound (POST Experience) is additive, not duplicate. Dodged architectural mess by 30 minutes. Real reminder to scan related plans before greenlit the design.

## Technical Details

**Existing Bokun Infrastructure (inbound only):**
- `bokun-api-client-with-hmac-authentication.ts`: HMAC-signed requests, typed responses, exp. backoff
- `availability.service.ts`: Caches departures, formats for widget
- `bookings.collection.ts`: CMS collection for incoming webhook data
- `widget/`: Embedded iframe fallback

**New Scope (outbound):**
- Reuse existing client; add `createExperience(tourData)` + `updateExperience(id, tourData)` methods
- Single source of truth: CMS Tour → POST to Bokun on save (afterChange hook + Jobs Queue with exp. backoff)
- No departure sync; Bokun dashboard owns scheduling
- Pricing mapping: per_person → Adult+Child pricingCategories; per_group → flat-rate or fallback
- Canary pattern for production-first risk mitigation: draft tour + __TEST DO NOT BOOK__ prefix + unavailable state

**Effort Estimate:** 12–18h across 7 phases (discovery, client extension, mapper, schema fields, job+hook, admin UI, canary validation)

## What We Decided

1. **One-way CMS→Bokun**, not bidirectional. Bokun is departure source of truth.
2. **Reuse HMAC client** — extend existing methods, don't fork.
3. **Production-first dev** mitigated by canary tour: draft status + test prefix + unavailable availability.
4. **Payload Jobs Queue** with exponential backoff for sync retries (not webhooks; we're pushing, not pulling).
5. **v1 scope**: text (name, description), pricing (adult/child rates), duration, meeting point. **Defer**: images, categories, custom fields.

## Root Cause Analysis

Why almost-duplicate? No pre-plan cross-reference check. Both plans (existing 260430-1520 + new 260514-1437) work Bokun infrastructure; first pass missed the 260430 phase files. Lesson: **scan related plans by component keyword before greenlit architecture**.

## Lessons Learned

1. **Grep before you design** — Search existing codebase for related implementation (e.g., `bokun-api-client*`, `Bokun` patterns in Phase files) before committing to architecture.
2. **Reuse beats refactor** — Extend existing client with new methods (5–10 lines) beats building parallel client (30+ lines, testing, drift).
3. **Canary pattern costs little, saves reputation** — Draft status + test prefix + unavailable availability = zero production blast radius for first sync.
4. **Jobs Queue is non-negotiable** — Payload afterChange is synchronous; offload Bokun HTTP to async job with retry.

## Next Steps

1. **Phase 01 (Discovery)**: Answer 5 open questions (locale codes, endpoint paths, per_group rate support, Payload runtime import, Jobs Queue config).
2. **Phase 02 (Client Extension)**: Add createExperience + updateExperience to bokun-api-client-with-hmac-authentication.ts.
3. **Phase 03 (Mapper)**: TourData → Bokun Experience schema (types, pricing logic).
4. **Phase 04 (Schema)**: Add CMS fields (externalBokuId, syncStatus, lastSyncTime).
5. **Phase 05 (Job+Hook)**: Payload afterChange hook + Jobs Queue handler.
6. **Phase 06 (Admin UI)**: Manual sync button + sync status badge.
7. **Phase 07 (Canary)**: Create test tour, validate full sync path.

**Cross-plan coordination**: Linked to 260430-1520 (go-live security + same HMAC client). Monitor phase interdependencies.

**Open Questions:**
- Locale code mapping (CMS language field → Bokun locale)?
- Endpoint path format for POST /experience (v1 vs v2)?
- per_group pricing strategy (API support vs fallback)?
- Payload Jobs runtime import pattern in CMS bundle?
- Jobs Queue config: max retries, backoff multiplier?

**Ownership**: Tasks 1–7 ready for phase leads. Recommend Phase 01 → 02 sequential (discovery unblocks client extension).
