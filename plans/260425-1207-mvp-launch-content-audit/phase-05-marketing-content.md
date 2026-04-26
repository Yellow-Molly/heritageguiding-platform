# Phase 05 — Marketing Content

## Context Links
- Research: [researcher-01-frontend-pages-audit.md](research/researcher-01-frontend-pages-audit.md) findings 1, 6, 7, 8, 10
- Research: [researcher-02-cms-i18n-content-audit.md](research/researcher-02-cms-i18n-content-audit.md) section 1 (trust claim flag)
- Depends on: phase-03 (verified business data), phase-02 (CMS reviews seeded if testimonials wired to CMS)

## Overview
- **Date:** 2026-04-25
- **Description:** Replace fake testimonials, verify/rewrite trust signals, decide blog inclusion, resolve schema.org aggregateRating, validate footer tour links.
- **Priority:** P1
- **Status:** pending
- **Review status:** not started

## Key Insights
- 4 fake testimonials (Sarah Mitchell, Marcus Weber, Emma Larsson, James Chen) w/ Unsplash placeholder avatars — visible on every homepage view
- Trust signals "15+ years", "98% happy travelers", "100% trusted", "Trusted by 2,000+ travelers" lack source
- Blog section is placeholder ("CMS integration deferred") w/ 3 fake posts
- Schema.org `aggregateRating: 4.9 / 735 reviews` — Google penalizes fake structured data
- Footer hardcodes "Gamla Stan Walking Tour", "Royal Palace Experience", "Vasa Museum Deep Dive" — slugs may not match CMS

## Requirements

### Functional
- Testimonials: 4+ real customer quotes w/ name + tour + permission to publish, OR section hidden
- Trust signals: every numeric claim sourced (records, analytics, contracts) OR rewritten as non-numeric
- Blog: decision = build CMS Posts collection OR hide `latest-posts.tsx`
- Schema.org aggregateRating: integrate real review aggregation (Payload Reviews query) OR remove block
- Footer tour links: server-fetched from CMS (3 featured tours) OR slugs verified to match seeded tours

### Non-functional
- All marketing copy passes Konsumentverket truthfulness standard (no unverifiable superlatives)
- Testimonials: GDPR consent recorded per quote
- Schema.org changes pass Google Rich Results Test

## Architecture

```
Real customer DB (CRM/email) ──► consent collected ──► testimonial copy
                                                            │
                                                            ▼
                                              Payload Reviews collection
                                              (verified: true)
                                                            │
                              ┌─────────────────────────────┤
                              ▼                             ▼
                  home/testimonials.tsx           seo/travel-agency-schema.tsx
                  (CMS-fetched)                   (aggregateRating from Reviews)
```

- Single review pool feeds both UI and schema.org (DRY)
- Trust-signal numbers either: (a) hardcoded with data source URL in comment, or (b) fetched from analytics

## Related Code Files

### Modify
- `apps/web/components/home/testimonials.tsx` — remove fake data; wire to CMS or delete component
- `apps/web/components/home/trust-signals.tsx:83-108` — update numbers w/ verified values OR rewrite copy
- `apps/web/components/home/latest-posts.tsx` — delete OR connect to Posts collection (post-MVP recommended)
- `apps/web/components/seo/travel-agency-schema.tsx:42-44` — aggregateRating logic
- `apps/web/components/layout/footer.tsx:9-15` — replace hardcoded tour links

### Read for context
- `packages/cms/collections/Reviews.ts` — fields available for aggregation
- `packages/cms/collections/Tours.ts` — featured filter for footer

## Implementation Steps

1. **Testimonials decision** (project lead + business owner):
   - Path A (real): Marketing collects 4+ testimonials via email survey → consent form → seed into Reviews collection (phase-02) → component fetches `where: { featured: true }`
   - Path B (hide): Delete `home/testimonials.tsx` import in homepage; remove file
2. **Trust signals decision** (per claim):
   - "15+ years" — confirm founding year; rewrite if < 15
   - "98% happy travelers" — source from review average; rewrite as "4.9/5 average rating" if applicable
   - "100% trusted" — meaningless superlative; replace w/ certification ("ISO 9001 certified") or remove
   - "2,000+ travelers" — source from booking count; rewrite if < 2000
3. **Blog decision** (project lead):
   - Path A (build): create Posts collection in Payload (post-MVP scope) — NOT recommended for MVP
   - Path B (hide): delete `latest-posts.tsx` from homepage import
4. **Schema.org aggregateRating** (depends on testimonials):
   - If real reviews seeded (≥10): aggregate `ratingValue` (avg) + `reviewCount` (count) from Reviews
   - If not: REMOVE `aggregateRating` block (avoid Google penalty)
5. **Footer tour links**:
   - Server-fetch top 3 `Tours` where `featured: true, status: published`
   - Render w/ locale-aware Link from `@/i18n/navigation`
   - Cache via `unstable_cache` (5min TTL)
6. Marketing lead approves all copy in 3 locales
7. PR opened; coordinate w/ phase-01 PR (may overlap testimonials.tsx)

## Todo
- [ ] Testimonials: real or hide decision
- [ ] If real: 4+ testimonials w/ consent collected
- [ ] If real: testimonials seeded into Reviews (coordinate phase-02)
- [ ] Trust signal "15+ years" verified or rewritten
- [ ] Trust signal "98% happy" verified or rewritten
- [ ] Trust signal "100% trusted" verified or rewritten
- [ ] Trust signal "2,000+ travelers" verified or rewritten
- [ ] Blog: build or hide decision (recommend hide for MVP)
- [ ] Schema.org aggregateRating: real or remove
- [ ] Footer tour links: server-fetched from CMS
- [ ] Marketing lead sign-off (all 3 locales)
- [ ] PR opened, coordinated w/ phase-01

## Success Criteria
- Zero fake names in production HTML (grep `Sarah Mitchell|Marcus Weber|Emma Larsson|James Chen` returns 0)
- Every trust-signal number has source comment in code OR is removed
- Blog placeholder posts not in production build
- Google Rich Results Test passes (no aggregateRating warnings)
- Footer tour links resolve to live tour pages (no 404)
- All copy reviewed in SV/EN/DE

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| No real testimonials available by launch | High | Med | Default to Path B (hide); add post-launch when collected |
| Trust claims unverifiable, marketing pushes back | Med | High | Business owner final call; rewrite as factual not aspirational |
| Blog build scope creep | High | High | DEFAULT HIDE for MVP; build post-launch |
| aggregateRating removal hurts SEO | Low | Med | Replace w/ tour-level reviews schema (per-tour Product schema) |
| Footer fetch adds latency | Low | Med | Cache 5min TTL; fallback empty state if Payload down |
| Testimonial GDPR consent missing | Med | High | Written consent template; record in CRM |

## Security Considerations
- Testimonial names: full name OR initials per consent — no surnames without explicit OK
- Consent records stored 5 years (defense against post-publication withdrawal)
- Schema.org rating: Google penalizes fake structured data — only publish if real
- Trust claims: false advertising risk under Marknadsföringslagen (Swedish Marketing Act)
- Footer dynamic fetch: handle Payload errors gracefully (no SSR crash)

## Next Steps
- Phase-01 picks up footer tour-link code change
- Phase-02 seeds real testimonials into Reviews if Path A
- Phase-07 grep audit confirms zero fake names
- Post-launch: testimonial collection workflow (post-tour email)
