# Phase 01 — Frontend Code Fixes

## Context Links
- Research: [researcher-01-frontend-pages-audit.md](research/researcher-01-frontend-pages-audit.md) findings 1-14
- Depends on: phase-03 (verified contact data), phase-04 (legal dates)

## Overview
- **Date:** 2026-04-25
- **Description:** Replace all hardcoded text/business data in frontend with i18n keys + env vars; resolve TODOs; remove or wire fake testimonials.
- **Priority:** P1
- **Status:** code complete — pending phase-03 env values + phase-04 real legal dates
- **Review status:** ready for review

## Key Insights
- 14 hardcoded findings across 7 files; footer.tsx is highest-impact (every page)
- i18n bundles already complete (579 keys × SV/EN/DE) — adding new keys low-risk
- Address mismatch: schema.org "Gamla Stan / 111 29" vs i18n "Drottninggatan 5 / 111 51" → MUST pick one canonical (decision in phase-03)
- Reviews TODO at `tours/[slug]/page.tsx:84` blocks dynamic per-tour reviews

## Requirements

### Functional
- All user-visible English text in non-i18n components → moved to messages/{sv,en,de}.json
- Business contact (email/phone/address/hours) sourced from i18n or env
- Privacy/Terms/Cancellation pages dynamic `lastUpdated` from constant or CMS
- Reviews section: feature flag OR removed (decision pending)
- Fake testimonials: replaced via CMS query OR component removed

### Non-functional
- No regression in 1009 unit tests
- No new hardcoded English in changed files (grep gate)
- Bundle size delta < 5KB

## Architecture

```
env (NEXT_PUBLIC_*) ─┐
                     ├──► server components ──► i18n hook (useTranslations)
i18n messages/*.json ┘                              │
                                                    ▼
                                           rendered HTML (3 locales)
```

- Contact constants: env-first (`NEXT_PUBLIC_CONTACT_EMAIL`), i18n fallback for display labels
- Tour links in footer: server-fetch from Payload (limit 3 featured tours) — KISS: no client fetch
- Reviews: introduce `NEXT_PUBLIC_REVIEWS_ENABLED` flag; default false until phase-02 seeds 10+

## Related Code Files

### Modify
- `apps/web/components/layout/footer.tsx` — newsletter, contact, tagline, lang selector, tour links
- `apps/web/app/(site)/[locale]/(frontend)/cancellation/page.tsx:95-96` — email/phone i18n
- `apps/web/app/(site)/[locale]/(frontend)/privacy/page.tsx:48,125` — date + email
- `apps/web/app/(site)/[locale]/(frontend)/terms/page.tsx:48` — date
- `apps/web/components/seo/travel-agency-schema.tsx:35-49` — address, ratings, social URLs
- `apps/web/components/contact/contact-info-section.tsx:18-21,73-82` — social URLs, "View on Google Maps"
- `apps/web/components/home/latest-posts.tsx:89-90,117-118` — "Read More" i18n
- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx:84` — Reviews TODO resolution
- `apps/web/components/home/testimonials.tsx` — wire to CMS OR delete
- `apps/web/messages/sv.json`, `en.json`, `de.json` — add new keys

### Read for context
- `apps/web/i18n/navigation.ts` — locale-aware Link usage
- `packages/cms/collections/Tours.ts` — featured tour query shape
- `apps/web/lib/payload.ts` — server-side Payload client (if exists)

### Create
- `apps/web/lib/contact-constants.ts` — single export of email/phone/address/hours from env+i18n
- `.env.example` updates: contact + REVIEWS_ENABLED flag

## Implementation Steps

1. Confirm canonical contact data from phase-03 sign-off doc
2. Add new i18n keys to sv.json (source), then en.json, de.json — keep parity:
   - `footer.newsletter.{heading,copy,placeholder,button}`
   - `footer.tagline`, `footer.languageSelector.{en,sv,de}`
   - `footer.tourLinks.heading` (links themselves come from CMS)
   - `cancellation.cta.{email,phone}`
   - `privacy.contact.emailLabel`
   - `common.viewOnGoogleMaps`, `common.readMore`
3. Create `lib/contact-constants.ts` exporting EMAIL, PHONE, ADDRESS_LINES[], HOURS_LINES[]
4. Refactor footer.tsx: replace hardcoded strings, swap tour links for Payload server fetch
5. Refactor schema.org component: pull address from constants; remove `aggregateRating` block (decision in phase-05) OR wire real data
6. Refactor cancellation/privacy/terms pages: i18n keys + dynamic dates from `lib/legal-dates.ts` constant
7. Reviews TODO: add `NEXT_PUBLIC_REVIEWS_ENABLED` env check; render section only when true
8. Testimonials decision branch:
   - **If wire to CMS:** create Reviews query, type per locale, fallback empty state
   - **If hide:** delete `home/testimonials.tsx` + remove from page.tsx
9. Run `pnpm lint && pnpm typecheck && pnpm test`
10. Grep gate: `rg -i "info@privatetours|drottninggatan|\\+46 8 123|sarah mitchell|marcus weber" apps/web/components apps/web/app` → expect ZERO matches
11. Open PR; tag reviewer

## Todo
- [ ] Get verified contact data from phase-03 (defaults populated; override via NEXT_PUBLIC_* env once signed)
- [ ] Get legal dates from phase-04 (placeholder 2026-04-25 in `lib/legal-dates.ts`)
- [x] Add i18n keys (3 locales, parity)
- [x] Create contact-constants module + legal-dates module
- [x] Refactor footer.tsx (server component, i18n, server-fetch top 3 featured tours, contact constants)
- [x] Refactor schema.org component (canonical address from constants; aggregateRating removed)
- [x] Refactor cancellation/privacy/terms pages (legal-dates + contact-constants)
- [x] Resolve Reviews TODO (removed — decision #4 keep hidden)
- [x] Resolve testimonials (deleted — decision #1 hide for MVP)
- [x] Hide latest-posts (deleted — decision #3 hide for MVP)
- [x] Run lint/typecheck — no new errors
- [x] Grep gate clean (info@privatetours / drottninggatan / fake names / 111 29 / 111 51 → 0 hits)
- [ ] PR opened + reviewed

## Success Criteria
- Grep for hardcoded business strings returns ZERO in apps/web/components and apps/web/app
- All 3 locales render footer/cancellation/privacy/terms without English fallback (unless intended)
- No regression in 1009 unit tests
- Schema.org JSON validated by Google Rich Results Test
- PR approved + merged to master

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Address decision delays start | Med | High | Block phase-01 on phase-03 sign-off; do other refactors in parallel |
| i18n key drift across locales | Med | Med | CI key-parity check (script: count keys per locale) |
| Hidden hardcoded strings missed | Med | Med | Grep gate in PR template + ESLint custom rule (post-MVP) |
| Removing testimonials breaks layout | Low | Low | Visual diff in PR + Lighthouse run |
| Server-fetch footer tours hurts SSR perf | Low | Med | Cache via `unstable_cache` (5min TTL) |

## Security Considerations
- Email/phone in env vars: not secrets but log if leaked to client bundle (already public in footer)
- Schema.org JSON: do NOT inject raw user data; sanitize before rendering
- Reviews flag: must be public env (NEXT_PUBLIC_) — no auth bypass
- No XSS vectors introduced (all strings via React, no dangerouslySetInnerHTML added)

## Next Steps
- Trigger phase-07 grep audit + Lighthouse after PR merge
- Document new i18n keys in `docs/codebase-summary.md` (phase-07 docs sync)
- Hand testimonials wiring to phase-02 if CMS path chosen
