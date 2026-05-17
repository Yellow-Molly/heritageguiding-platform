---
phase: 02
title: "Content Readiness"
priority: P0
status: blocked
effort: gated on `260425-1207-mvp-launch-content-audit`
owner: Content team + Business owner
blockedBy: 260425-1207-mvp-launch-content-audit
---

# Phase 02 — Content Readiness

## Context

Scout: `plans/reports/Explore-260514-1458-content-readiness.md`

This phase is a **status mirror** of `260425-1207-mvp-launch-content-audit`. No new work owned here. Goal: track that plan's completion as launch gate.

## Findings

### P0 — BLOCKING

#### C1. ~~CMS is empty~~ → RESOLVED (verified 2026-05-15)
- **Verified live DB:** 10 published tours, 15 active guides, 10 published categories, 97 media items, all 3 locales populated.
- **Verification SQL run against production Supabase:**
  ```sql
  -- Result: tours=11 (10 published + 1 canary draft), guides=15, categories=10, media=97, reviews=0
  SELECT 'tours' AS t, COUNT(*) FROM tours UNION ALL
  SELECT 'guides', COUNT(*) FROM guides UNION ALL
  SELECT 'categories', COUNT(*) FROM categories UNION ALL
  SELECT 'media', COUNT(*) FROM media UNION ALL
  SELECT 'reviews', COUNT(*) FROM reviews;

  -- All published tours have all 3 locales:
  -- sv=10, en=10, de=10
  ```
- **Status:** ✅ Exceeds launch minimum (5+ tours, 2+ guides, 6+ categories).
- **Note:** Reviews=0 by design (locked decision in `260425-1207` — skip MVP, hide UI, no schema.org aggregateRating).

#### C2. Bokun Experience ID mapping (REAL blocker — promoted from C3)
- **Verified:** 0 of 10 published tours have `bokun_experience_id` populated.
- **Effect:** Booking widget cannot load on ANY tour detail page — booking impossible.
- **Owner:** `260425-1207` phase-02 + `260430-1520` phase-03 (test-env validation creates experiences)
- **Action:**
  1. Create matching Bokun Experiences for the 10 published tours (manual via extranet, or via outbound sync from `260514-1437` if shipped).
  2. Populate `bokun_experience_id` on each Tour record.
  3. Verify widget loads on each tour detail page.
- **Canary already staged:** Tour id=11 `test-do-not-book-canary-tour` (draft) ready for validation.

#### C3. Legal copy effective dates still placeholder
- **Current:** Privacy/Terms render dates `2026-05-09` / `2026-05-04` but Phase-04 legal review of plan `260425-1207` is **pending counsel sign-off** — these are drafts.
- **Owner:** `260425-1207-mvp-launch-content-audit/phase-04-legal-review.md`
- **Done when:** Counsel signs, real dates committed to i18n keys.

#### C4. Business contact env vars unset
- **Current:** `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_LEGAL_VAT` defaulted/stubbed.
- **Owner:** `260425-1207-mvp-launch-content-audit/phase-03-business-data-verification.md` + `260506-2049-real-company-phone-rollout`
- **Required values:** phone (real company), email (real inbox), VAT (Bolagsverket lookup), WhatsApp number

### P1 — Risk-Waiverable

#### C5. Real photography for tours/guides
- **Current:** No images uploaded to media collection.
- **Acceptable risk:** Launch with seeded images — quality affects conversion but not legality.
- **Owner:** `260425-1207` phase-02 + phase-05

#### C6. Trust signals copy (homepage)
- **Status:** Phase 05 of `260425-1207` — marketing rewrite pending. Current copy may be undefensible.
- **Owner:** `260425-1207-mvp-launch-content-audit/phase-05-marketing-content.md`

### P2 — Post-Launch Acceptable

#### C7. Customer reviews seeded
- **Decision (locked):** Skip for MVP. Reviews UI hidden. Schema.org `aggregateRating` omitted until real data.

#### C8. Blog posts
- **Decision (locked):** Hidden for MVP.

## Done Criteria (mirror `260425-1207` success criteria)

- [x] C1: ≥5 tours, ≥2 guides, ≥6 categories published in sv/en/de — **VERIFIED 2026-05-15** (10/15/10)
- [ ] C2: All published tours have valid `bokun_experience_id` + widget loads e2e (currently 0/10)
- [ ] C3: Legal pages counsel-signed with real `lastUpdated`
- [ ] C4: Business owner signs off contact env vars (phone, email, VAT)
- [x] C5: Tour + guide hero images uploaded — **VERIFIED** (97 media items)
- [ ] C6: Trust signals copy approved by marketing

## Open Questions

1. Content delivery deadlines per locale? (open from `260425-1207`)
2. WhatsApp number? (open from `260425-1207`)
3. Translation review process for non-Swedish content?
