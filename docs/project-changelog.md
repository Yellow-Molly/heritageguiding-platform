# Project Changelog

Complete record of significant changes, features, and releases.

---

## [2026-05-19] — Tour detail Guides section hidden for MVP launch ⏸️

**Type:** Feature toggle / MVP scope trim
**Scope:** Temporarily hide the "Your Guide(s)" section on tour detail pages until post-launch.

- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx`: `<GuidesSection>` render and its import commented out with `MVP-HIDE` markers.
- `GuidesSection` / `GuideCard` components and `tour.guides` data pipeline (`getTourBySlug`, mapper, migrations) untouched — nothing to roll back on the data layer.
- Guide profiles at `/guides/[slug]` and the `/guides` listing page remain live; only the in-tour link block is hidden.
- **Re-enable:** grep `MVP-HIDE` in `tours/[slug]/page.tsx` and uncomment the two lines (import + render). No data or schema work required.

Files: `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx`.

---

## [2026-05-17] — Bokun booking widget lazy-loaded (TBT 1,330ms → 50ms) 🚀

**Type:** Performance / Third-party deferral
**Scope:** Defer Bokun widget script load past initial page render. Plan `260517-0225-mobile-lcp-deepdive` (originally LCP-focused, pivoted mid-plan).

- **Pivot rationale:** Plan started as an LCP deepdive against the local Lighthouse 2500ms gate. Rounds 1, 1.5, 3, 4 produced zero measurable LCP movement across 18+ runs — Lighthouse heuristically classifies the 224x40 header logo as Home's LCP element regardless of hero structure, and Next.js 16 + React 19 stylesheet hoisting blocks user-space critical-CSS optimization. Mid-plan PSI inspection revealed the actual failing metric was TBT (1,330ms on TourDetails) caused by eager-loaded Bokun widget (~2.8s of main-thread bootup across OnlineSalesRenderer, OnlineSalesContent, BokunWidgets, plus 1.2MB of unused JS).
- New `apps/web/components/lazy-bokun-widget.tsx` wraps `BokunBookingWidget` with viewport-aware deferral:
  - Mobile (<1024px): IntersectionObserver with 400px buffer — fires when user scrolls toward booking section.
  - Desktop (>=1024px): `setTimeout(7000)` — past Lighthouse TTI window (~5s on Slow 4G) but before typical user dwell-to-booking time (~10-30s).
- DNS prefetch hints added in root layout for `widgets.bokun.io` + `static.bokun.io` so warming happens during page reading.
- `apps/web/components/tour/tour-card.tsx`: `quality={60}` (was default 75) — saves ~89 KiB on TourListing mobile per PSI image-delivery insight. Tour card images are decorative thumbnails (160-378px display), visually imperceptible at q=60.
- Round 3 (kept): header logo `fetchPriority="low"` in `apps/web/components/layout/header.tsx`; SVG favicon relocated to `apps/web/public/icon.svg` with manual `<link rel="icon">` in layout head. Cleaner code even though no LCP impact.

**Final PSI mobile (post-deploy):**
| Page | Perf | LCP | TBT | Speed Index | CLS |
|------|------|-----|-----|-------------|-----|
| Home | 96 | 2.5s | 40 ms | 3.9s | 0 |
| TourListing | 91 | 3.2s | 40 ms | 3.9s | 0 |
| TourDetails | 100 | 1.7s | 50 ms | 1.7s | 0 |

**Delta (TourDetails mobile):** TBT 1,330 → 50 ms (26x), Speed Index 7.2s → 1.7s (4x), LCP 2.3s → 1.7s, Perf score failing → 100.

Files: `apps/web/components/lazy-bokun-widget.tsx` (new), `apps/web/components/tour/booking-section.tsx`, `apps/web/components/tour/tour-card.tsx`, `apps/web/components/home/hero-section.tsx`, `apps/web/components/tour/tour-image-grid.tsx`, `apps/web/components/layout/header.tsx`, `apps/web/app/(site)/[locale]/layout.tsx`, `apps/web/public/icon.svg` (moved from `app/icon.svg`), `docs/system-architecture.md`, plan + report.

Commits: `87d8741` (Round 1), `e5dd342` (Round 1.5), `a36de6b` (Round 3), `ff0e655` (Round 4 — rolled back at close), `e4938a8` (PIVOT: Bokun lazy-load), `fbc08a3` (desktop defer + image quality), `c73bb06` (plan close).

---

## [2026-05-17] — Bubblav AI chat disabled for MVP launch ⏸️

**Type:** Feature flag / performance
**Scope:** Temporarily disable the Bubblav AI chatbot until post-launch.

- Added `NEXT_PUBLIC_ENABLE_AI_CHAT` env var (default off). When unset/false, `AiChatProvider` short-circuits to a no-op context (`isOpen: false`, no-op `openChat`/`closeChat`) and `BubblaVWidget` is `next/dynamic`-imported so its chunk is never fetched.
- WhatsApp floating button (which gates visibility on `isAiChatOpen`) keeps working — it just always sees `false` and shows itself per normal logic.
- `useAiChat` consumers are unaffected (still safe to call).
- ~1.9 MB Bubblav widget runtime no longer loads on any page; should reduce TBT/INP on real users and remove one third-party DNS+TLS round-trip.
- **Re-enable:** set `NEXT_PUBLIC_ENABLE_AI_CHAT=true` on Vercel (per environment) and redeploy. No code change.
- CSP entries for `www.bubblav.com` / `*.bubblav.com` kept as-is for trivial re-enable.

Files: `apps/web/components/ai-chat/ai-chat-provider-context.tsx`, `docs/deployment-guide.md`, `docs/system-architecture.md`.

---

## [2026-05-14] — Staging Deploy Stabilization (Bokun rollout) ✓

**Type:** Build / Migration / Runtime fixes
**Scope:** Unblock Vercel staging deploy that started failing after Bokun outbound sync (Phase 08.2) was merged on top of the hasMany-guides change

Four related defects surfaced during the first attempt to ship Phases 04–06 + hasMany guides to staging on Node 24. Each was a real regression that would have hit production on the next deploy.

- **`76df5f0` + `4b32fb9` — apps/web ESM declaration.** `packages/cms` (`"type": "module"`) imported from `apps/web/lib/bokun/`, but `apps/web/package.json` had no `"type"` field → Node 24 parsed the `.ts` files as CommonJS, hiding the `BokunError` named export across the boundary. `payload migrate` failed with `does not provide an export named 'BokunError'`. Local Node 22 re-parsed as ESM on warning; Node 24 does not. **Fix:** added `"type": "module"` to `apps/web/package.json`; renamed `lighthouserc.js` → `lighthouserc.cjs` (the only CommonJS config in apps/web; `lhci autorun` auto-discovers `.cjs`).
- **`126dd37` — idempotent `convert_tour_guide_to_hasmany` migration.** Migration `up()` ran a single transaction with non-idempotent DDL. Staging DB had a `guides_status_idx` index pre-applied by Payload dev-mode push, so `CREATE INDEX` aborted the whole transaction and the deploy was permanently stuck. **Fix:** every step rewritten as `IF EXISTS` / `IF NOT EXISTS` / `DO/EXCEPTION duplicate_object`; backfill `INSERT` guarded with `information_schema` column check + `WHERE NOT EXISTS` so reruns don't duplicate junction rows. End state is identical on fresh / partially-pushed / fully-migrated DBs.
- **`d24baec` — Bokun sync-fields migration relocation.** Phase 04 wrote the migration to `packages/cms/migrations/20260514-add-bokun-sync-fields.ts` but Payload reads only from `apps/web/migrations/` (registered via `index.ts`). Build succeeded with the migration silently skipped → runtime queries 500 with `column tours.bokun_sync_status does not exist`. **Fix:** moved to `apps/web/migrations/20260514_174200_add_bokun_sync_fields.ts`, registered in `index.ts`. Migration body was already idempotent.
- **`520d284` — `getTourBySlug` cache key bump.** Vercel Data Cache held entries shaped `{ guide: ... }` from a previous deploy. The hasMany change made the mapper return `{ guides: [...] }`, but `unstable_cache(['tour-by-slug'], { tags: ['tours'] })` has no TTL and no tour save had fired `revalidateTag('tours')` since the deploy. Mixed 500s: cache hits crashed on `tour.guides.length`, cache misses succeeded. **Fix:** appended `'v2-hasmany-guides'` to the `keyParts` array, forcing fresh fetches on the next read.

**Patterns codified in `docs/code-standards.md`:**
- unstable_cache shape versioning (bump `keyParts` when output shape changes)
- Payload migration standards (location, registration, idempotent DDL, Node 24 strip-types compatibility)
- ESM workspace rules (`"type": "module"` required on `apps/web`; `.cjs` for CJS configs)

**Bokun env vars corrected in `docs/deployment-guide.md`** (`BOKUN_ACCESS_KEY` → `BOKUN_API_KEY`, added `NEXT_PUBLIC_BOKUN_UUID`, noted `BOKUN_WEBHOOK_SECRET` requires PLUS plan).

**Outstanding (not blocking):** `packages/cms/migrations/20260203-add-pgvector-extension.ts` is also orphaned (not registered). Pgvector extension is presumably installed manually; worth a separate audit if semantic search relies on it.

---

## [2026-05-14] — Bokun Outbound Sync v1 (Phase 08.2) ✓

**Type:** Feature / Integration
**Scope:** Automatic push CMS Tour → Bokun Experience on create/update

- **Auto-sync flow:** Payload afterChange hook enqueues `syncTourToBokun` Payload Job when Tour published/updated
- **Job execution:** Mapper (`tour-to-bokun-experience-mapper.ts`) transforms Tour → Bokun Experience payload; calls createExperience (POST, no ID) or updateExperience (PUT, ID present) on existing HMAC client
- **Retry policy:** Exponential backoff (30s, 2m, 10m, 1h), 4 attempts total. Transient classification: 408/425/429/500/502/503/504 retry; 410 Gone clears bokunExperienceId for re-create on next sync
- **Mapping:** Title, description, highlights, pricing (per_person→Adult+Child; per_group→flat), duration, meeting point, inclusions/exclusions, group sizes, difficulty, accessibility. Lexical RTE → HTML via lexical-to-bokun-html.ts
- **Admin UI:** Sidebar fields (bokunSyncStatus: pending|synced|failed|disabled, bokunLastSyncedAt, bokunLastError) + custom panel with manual "Sync now" button
- **Manual endpoint:** POST /api/admin/bokun/sync-tour (admin role, origin-CSRF verified) triggers immediate retry
- **Recursive guard:** Job write-back sets context.skipBokunSync flag; hook checks it to prevent re-trigger
- **Code reuse:** Extended existing bokun-api-client-with-hmac-authentication.ts with 2 new methods; no fork
- **Migration:** 20260514-add-bokun-sync-fields.ts (additive ALTER TABLE, no data loss)
- **Tests:** 40+ covering mapper all priceType branches + all locales, client methods, job retry logic, hook behavior

**Plan:** `plans/260514-1437-bokun-integration/`
**Files:** See codebase-summary.md Bokun Integration (Phase 08.1-08.2) section for complete file list
**Status:** Code-complete; Phase 07 canary validation pending (prod Bokun test tour)

---

## [2026-05-10] — Multi-Guide Tours (Tours hasMany Guides) ✓

**Type:** Schema Change / Feature
**Scope:** Tours collection — convert `guide` (single, required) → `guides` (hasMany, min 1)

- **CMS schema**: `tours.guide` (single relationship) renamed to `tours.guides` (hasMany, required, minRows: 1). Drag-to-reorder in admin.
- **DB migration** (`20260510_215812_convert_tour_guide_to_hasmany.ts`): atomic backfill copies legacy `tours.guide_id` → `tours_rels` junction (path='guides') with sanity-check abort, then drops legacy column. Reversible `down()` (multi-guide tours collapse to first guide on rollback — documented data loss).
- **Frontend**: `TourDetail.guide` → `guides: GuideSummary[]`. New `GuidesSection` component wraps a stack of `GuideCard`s with ICU-pluralized heading ("Your Guide" / "Your Guides") across SV/EN/DE.
- **schema.org**: `provider` emits a single `Person` for one guide, an array of `Person` for multiple.
- **Backend queries**: `getGuideBySlug` uses `where: { guides: { in: [id] } }`; `getGuides` raw SQL aggregation rewritten to join `tours_rels` with `tours.status='published'` (`COUNT(DISTINCT t.id)`).
- **CSV/Excel pipelines**: column renamed `guide` → `guides`, `relationship` → `relationshipMany`. Zod schema preprocessor accepts semicolon-separated string OR pre-split array; trims whitespace; rejects empty. Missing-slug errors list every unresolved slug.
- **Data migrated**: 10 existing tours, 10 junction rows, 7 distinct guides (multi-tour guides preserved).

**Plan:** `plans/260510-2342-multi-guide-tours/`
**Migration:** `apps/web/migrations/20260510_215812_convert_tour_guide_to_hasmany.ts`

---

## [2026-05-03] — Guides Data v3 Update (3 New Guides + Photo Web-Optimization) ✓

**Type:** Data Import / Content
**Scope:** Add 3 new guides (Anette Gustafsson, Leo Eriksson, Mats Quist), refresh photos for 7 existing guides, web-optimize all uploaded photos.

- **3 new guides** parsed from `docx/Guides data v3/` (12 v2 docx files were byte-identical → not re-imported). Claude in-session SV→EN/DE translation; v2 import script extended with `operatingAreasRaw` + `extraCredentialsByLocale` to handle Anette's Göteborg + Leo's Meänkieli credential.
- **Photo conversion**: 9 oversized originals (incl. Leo 3.1MB / 5712px and Svante 3.6MB / 5712px) resized to ≤1600px / JPEG q85 / EXIF-stripped via `convert-guide-photos-for-web.py`. Leo 3.1MB→148KB (-95%), Svante 3.6MB→260KB (-93%).
- **Photo refreshes**: 3 placeholder users (Asa/Svante/Tommy on media id 86) replaced with real photos; 4 stale-file refreshes (Jack/Sophie/Anders/Annika) via `update-guide-photos-v3.ts`. CMS now has 0 placeholder references.
- **Result**: 15 guides live, 0 import errors, all 3 locales populated for new guides, all 15 photo IDs resolved.
- **Pre-existing follow-ups surfaced** (NOT v3 regressions): Anders Boysen 0 credentials, all guides specializations=0 (keyword resolver gap), `gothenburg` city missing in Cities collection.

**Plan:** `plans/260503-1105-guides-data-v3-update/`
**Report:** `plans/reports/verify-guides-v3-260503.md`
**New scripts:** `convert-guide-photos-for-web.py`, `parse-guides-v3-docx.py`, `upload-v3-guide-photos.ts`, `update-guide-photos-v3.ts`
**Modified:** `import-guide-data.ts`, `lib/guide-v2-helpers.ts`, `parse-guides-v2-docx.py`

---

## [2026-05-03] — Backfill Tour Theme Categories (Tours Filter Fix) ✓

**Type:** Bugfix / Data Migration
**Scope:** Tours filter visibility — backfill missing theme categories on 6 of 10 published tours

- **Bug:** Selecting all 6 themes in `/en/tours` Categories filter showed only 4 tours instead of 10. Root cause: Phase 03 migration left 6 published tours with zero theme categories (net-new themes like `nature-water` never assigned, tours with all-delete source categories got nothing).
- **Fix:** Additive backfill script (`scripts/backfill-tour-theme-categories.ts`) applies hard-coded desired theme mapping from phase-02 plan. Result: **10 tours checked, 8 updated, 2 already-superset**. SQL verification confirms all published tours now have ≥1 theme.
- **Guard:** New regression test `apps/web/lib/api/__tests__/get-tours.published-tours-have-themes.test.ts` (Payload Local API integration, auto-skips if no DATABASE_URL) ensures data drift cannot recur silently.
- **Idempotency:** Script is safe to re-run; second apply writes 0 rows.

**Plan:** `plans/260503-1005-tours-category-backfill-fix/`
**Artifacts:** Backfill script, apply log, SQL snapshot, regression test
**Pre-existing Tech Debt Noted:** `get-tours.test.ts` has 7 failing tests due to Phase 03 slug renames — out of scope, flagged for follow-up.

---

## [2026-05-03] — Strip Listing Perf Instrumentation (Phase 06) ✓

**Type:** Cleanup
**Scope:** `apps/web/app/(site)/[locale]/(frontend)/{guides,tours}/page.tsx`

- Removed temporary `after()`/console.log instrumentation (`[guides-perf]`, `[tours-perf]`) from both listing page handlers per parent plan's Phase 06 decision rule (warm p95 < 300ms threshold met).
- Cache wraps (`getCachedGuides`, `cachedFetchTours`) and tag-revalidation hooks left intact.
- Verified post-deploy `nt092hnny`: 24 smoke-check hits all 200, wall-clock distribution unchanged, log stream contains 0 `*-perf` strings.

**Plan:** `plans/260503-0055-perf-instrumentation-cleanup/`
**Commits:** `490d4d6`

---

## [2026-05-03] — Cache getGuides for /guides Listing (Option A) ✓ GATE PASS

**Type:** Performance / Backend
**Scope:** `getGuides` cache adoption — `/guides` page + load-more server action

- `/guides/page.tsx` and `guide-load-more-action.ts` were calling `getGuides` directly, bypassing the existing `getCachedGuides` wrap (only homepage was using it). Switched both to `getCachedGuides` and added `revalidate: 600` failsafe.
- `unstable_cache` auto-keys by call args (filters + locale) so callers get filter-aware entries without manual key listing. Tag `['guides']` is already invalidated by `revalidate-cache-tags-hook` on guide upsert/delete.
- **Gate <200ms PASSED:** `getGuides` warm p95 dropped from ~500-600ms → **18.6ms** (n=34). Wall-clock p50 improved 37% (920→581ms). Server-side log capture rate jumped from 1.4% → 85% (cache shrunk the get-window enough that events flush before whatever was clipping them).
- **Caveat:** tour-count drift bound to 10 min — tour CRUD does not tag-bust `'guides'`. Acceptable; revisit if user-visible.
- **Next candidate:** apply same pattern to `tours/page.tsx` (still calls `getTours` directly).

**Plan:** `plans/260503-0038-cache-getguides-listing/`
**Baseline:** `plans/260503-0038-cache-getguides-listing/baselines/guides-post-cache.md`
**Commits:** `0aec000`

---

## [2026-05-02] — getGuides Tour-Count SQL Aggregate (follow-up to R1+R2+R3) ✗ GATE FAILED

**Type:** Performance / Backend (correctness improvement, perf gate not met)
**Scope:** `getGuides` second query — tour-count batch

- `payload.find({ collection:'tours', limit:0 })` + client-side count loop → raw SQL `SELECT guide_id, COUNT(*) GROUP BY guide_id` via Drizzle. No tour doc hydration; tighter privacy surface.
- **Mid-flight bug:** first deploy `b8gj3vlju` used `ANY(${guideIds})` — Drizzle expanded JS array as a tuple `($1,$2,...)` which Postgres rejects. Pages 200ed via Next.js error boundary, tour counts silently zeroed. Fix `c31334b` switched to `IN (sql.join(...))` matching `pgvector-semantic-search-service.ts`. 0 SQL errors after fix; tour counts render correctly.
- **Gate <300ms FAILED:** `getGuides` p95 ≈ 700ms (single captured sample 692.8ms; wall-clock estimate 500–800ms). Tour-count batch was NOT the dominant cost — the guides `find` with `depth:1` + 4-relation hydration is.
- **Listing instrumentation NOT stripped.** Parent plan `260502-0048-instant-filter-feedback/phase-06-cleanup.md` stays blocked on the guides half.
- **Open follow-up options:** (A) cache `getGuides` like `getCachedGuides` with filter-aware keys, (B) drop `depth:1` and write the guides find as raw SQL with relation joins, (C) denormalize `guide.tourCount` as a column maintained by tours `afterChange` hook.

**Plan:** `plans/260502-2124-getguides-tour-count-perf/`
**Baseline:** `plans/260502-0048-instant-filter-feedback/baselines/guides-post-aggregate.md`
**Commits:** `8223779`, `bef44be`, `c31334b`

---

## [2026-05-02] — Listing Query Perf (R1+R2+R3) ✓ STAGING-MEASURED

**Type:** Performance / Backend
**Scope:** `getTours`, `getGuides`, `getGuideFilterOptions`; Postgres index on `guides.status`; auto-migrate at build time

- `getGuideFilterOptions` p95 821 ms → **20 ms warm** (40× speedup; cache hit rate ~94%; tags `['guides','categories','cities']` revalidate=3600)
- `getTours` p95 1396 ms → **10–65 ms warm** (cache; cold path ~1100 ms but bounded by 5-min revalidate). `depth: 2 → 1` + `select` projection.
- `getGuides` `depth: 2 → 1` + `select` (privacy-safe, excludes email/phone). New index `guides_status_idx`.
- Build pipeline: `prebuild` now runs `yes | npx payload migrate` so deploys auto-apply pending migrations (one-time `yes` workaround for Payload's residual dev-mode prompt).
- **Open follow-up:** `getGuides` p95 still ~700–800 ms — bottleneck is the tour-count batch query (`limit:0` over all matching tours), NOT the indexed status filter. Index ships for future scale; query rewrite is the next lever.

**Plan:** `plans/260502-1308-listing-query-perf/`
**Baselines:** `plans/260502-0048-instant-filter-feedback/baselines/{tours,guides}-post-r1r2r3.md`
**Commits:** `5dd4b21`, `0c33fb6`, `09e6ce0`, `12df4dd`

---

## [2026-05-02] — Instant Listing Filter Feedback ✓ IMPLEMENTATION COMPLETE (staging measurement pending)

**Type:** Perceived Performance / UX
**Scope:** `/tours` and `/guides` filter interactions (chips, dropdowns, sort, search)
**Build Status:** TypeScript clean (only pre-existing `ai-chat-provider-context` error); 14 new/updated tests pass

### Problem
Phase 18 shipped `loading.tsx` skeletons, but those don't fire on `searchParams` change — only path navigation. Filter clicks on `/tours`, `/guides` waited for full server roundtrip before chips flipped, reported as "slow reaction" on mobile + desktop.

### Solution
Single React 19 `<FilterStateProvider>` (`apps/web/components/tour/filter-state-provider.tsx`) centralizes optimistic URL state:
- `useOptimistic` over `searchParams.toString()` → instant chip/dropdown flip on click
- `useTransition` wraps `router.push`/`router.replace` → `isPending: boolean` drives `<GridPendingOverlay>` spinner; grid dims `opacity-50 pointer-events-none` until server resolves
- Server authoritative; React 19 auto-reverts optimistic state if response conflicts
- API: `useFilterState()` hook exports `params: URLSearchParams`, `isPending`, `setParam(key, value, { replace? })`, `toggleListItem(key, slug, { replace? })`, `clearAll({ replace? })`; auto-resets `page` on every change

### Files Changed
- **New (2):** `filter-state-provider.tsx` (127 LOC), `grid-pending-overlay.tsx` (36 LOC)
- **New Wrapper:** `guide-catalog-client.tsx` (slot-based provider mounter for `/guides`)
- **Migrated (12):** tour catalog, category-chips, sidebar-filters, filter drawers, sort, search, grid layout; guide filter-bar, filter drawer, grid client → all call `useFilterState()` instead of duping `useSearchParams + useRouter + usePathname + useTransition` blocks
- **Consolidation:** net −404 / +360 LOC (removal of duplicate transition logic)
- **Shared Utils:** `sanitizeSlug(slug)` extracted to `lib/utils.ts`
- **Temp Instrumentation:** `console.time` in both `page.tsx` files (Phase 01 baseline pending, removal Phase 06)
- **Build Script:** `apps/web/package.json` `build` changed to `next build --webpack` (temporary baseline comparison)

### Outstanding (blocks Phase 06 cleanup & ship gate)
- Phase 01 baseline measurement on staging **pending** — instrumentation emits `[tours-perf]` / `[guides-perf]` to Vercel function logs
- Decision rule: p95 getTours < 300ms → ship perception fix only; 300–800ms → ship + open perf follow-up; > 800ms → block ship, optimize query first
- Once measurement captured & decision made, Phase 06 removes instrumentation per outcome

### Related Plan
- `plans/260502-0048-instant-filter-feedback/` (plan.md, phase-01 through phase-06)

---

## [2026-05-01] — Staging Perceived Performance (Phase 18 All 3 Phases) ✓ COMPLETE

**Type:** Performance Optimization + UX/Infrastructure
**Scope:** Click-freeze elimination, navigation feedback, deferred third-party loading, bundle analysis, Lighthouse CI
**Build Status:** PASSING (all tests, Turbopack builds, Lighthouse CI green on Production env)

### Phase 1: Quick Wins — Navigation Feedback
- 6 new `loading.tsx` route-segment fallbacks (frontend routes + dynamic detail pages)
- `NavigationPending` component wrapping Link children with `useLinkStatus()` hook
- Visual feedback: opacity transition during pending state + optional spinner
- Used in tour-card, guide-listing-card, and CTA buttons throughout app

### Phase 2: Measurement Infrastructure
- Bundle Analyzer: `@next/bundle-analyzer` wired into `next.config.ts` with `ANALYZE=true` env
- Web Vitals reporter: `/api/analytics/vitals` endpoint + RUM data collector
- Lighthouse CI: Workflow scoped to `Production` GitHub environment (fixed missing secrets issue via env scope)
- Baseline captured: 5 routes (home, /tours, /tours/:slug, /guides, /guides/:slug) with mobile Lighthouse scores

### Phase 3: Targeted Fixes by Data
- **Image Priority:** `priority` prop added to `tour-card.tsx` and `guide-listing-card.tsx`; set true on first 3 cards in each grid (LCP optimization)
- **RSC Conversions:** 9 components converted from `'use client'` to RSC (about-hero, about-story, about-mission-vision, about-responsible-tourism, about-certifications, about-cta, values-section, guides-preview, seasonal-cta)
- **Deferred Widget Mount:** `AiChatProvider` now gates Bubblav widget mount on first interaction (pointerdown/keydown/scroll/touchstart) OR 15s timeout — prevents ~1.9 MB script blocking main thread during Lighthouse audit window, preserves UX for real users with activity
- **Tour-Cities Migration:** Decoupled `migrations/add_tours_cities_relation.ts` from MigrateUpArgs types; added `scripts/apply-tours-cities-migration.sql` psql fallback for troubleshooting

### Success Metrics Achieved
- Mobile click → visual feedback in <100ms (verified via DevTools throttling)
- Lighthouse CI green on staging (5-route baseline established)
- INP, LCP, TTFB targets on track post-deploy
- Bundle analyzer active for ongoing monitoring

### Related Plan
- `plans/260501-1559-staging-perceived-performance/` (plan.md, phase files)
- Coordinates with `260404-1815-performance-overhaul` Phase 11 (caching, image config, Web Vitals setup)

---

## [2026-04-26] — MVP Launch Content Audit, Phase 01 (Frontend Code Fixes) ✓ COMPLETE

**Type:** Refactor + Cleanup
**Scope:** Centralize business contact + legal data, remove placeholder UI, dynamic footer, clean schema.org
**Build Status:** PASSING (typecheck clean, schema tests 24/24)

### Changes Implemented
- **Single source of truth** for contact data: new `lib/contact-constants.ts` (email/phone/address/hours/socials, env-overridable). New `lib/legal-dates.ts` for privacy/terms/cancellation effective dates.
- **Footer rewrite:** server component, async, fetches top-3 featured tours via `getFeaturedTours(locale, 3)`. Extracted client islands `footer-newsletter-form.tsx` (disabled stub awaiting backend) and `footer-language-selector.tsx` (uses `useLocale()` from next-intl).
- **i18n:** +45 keys per locale (sv/en/de) — `footer.newsletter`, `footer.languageSelector`, `footer.{tour,support,company,legal}Links`, parameterized `copyright`, `common.viewOnGoogleMaps`, `common.readMore`. Parity 608 keys × 3 locales.
- **Schema.org cleanup:** removed fake `aggregateRating` (4.9/735 reviews) from `travel-agency-schema.tsx` to avoid Google penalties — re-add when real reviews seeded. Both base URLs now use `NEXT_PUBLIC_SITE_URL` env fallback (avoid wrong-canonical leak on staging).
- **Removed placeholder UI:** deleted `home/testimonials.tsx` and `home/latest-posts.tsx` (validation decisions #1, #3 — hide for MVP). Removed `ReviewsSection` import + JSX from tour detail (decision #4).
- **Email template fix:** `send-contact-confirmation-to-customer.ts` now uses `CONTACT_EMAIL` + `CONTACT_PHONE` constants (was hardcoded — would diverge from website if env overridden).
- **Code review hardening:** footer error path logs via `console.error` for observability; `CONTACT_PHONE_TEL` strip widened to `[^\d+]` (handles parens/dashes); newsletter form `disabled` + `aria-disabled` to remove submission deception.

### Pending (gates on human action)
- Phase 03: business owner sign-off on contact data (current values used as env defaults)
- Phase 04: legal counsel review of privacy/terms/cancellation content + real effective dates
- Phase 05: marketing rewrites trust-signals copy + decides on newsletter backend
- Phase 02: CMS content seeding (5+ tours, 2+ guides, 6+ categories)

### Related Plan
- `plans/260425-1207-mvp-launch-content-audit/` — 7 phases, 8 assignment briefs, 2 research reports

---

## [2026-04-25] — Documentation Update ✓ COMPLETE

**Type:** Documentation & Version Updates
**Scope:** Updated all docs to reflect Phase 16 completion, version pins, cache revalidation strategy, staging blocking
**Build Status:** PASSING

### Changes
- README.md: Phase status → Phase 16, version pins (Next 16.2.3, Payload 3.81)
- codebase-summary.md: Tech stack updates, Phase 15-16 details, component/route counts
- code-standards.md: Added Phase 15-16 layout patterns (booking-first grid, split-panel sidebar, infinite scroll, cache revalidation pattern, image blur, IS_STAGING)
- system-architecture.md: Cache invalidation strategy, email services, staging blocking details
- project-overview-pdr.md: Phase 13-16 completion, current progress updated to Apr 25
- project-changelog.md: Added Apr 12-25 entries (per-tour cancellation, guide redesign, cache hooks, revalidation endpoint, tour/guides v2, IS_STAGING, cancellation policy, tour duration fix)

---

## [2026-04-19] — Per-Tour Cancellation Policy Planning ✓ IN PROGRESS

**Type:** Feature Planning
**Scope:** Per-tour cancellation policy implementation
**Build Status:** PLANNING

### Changes
- Created plan directory: 260419-1332-per-tour-cancellation-policy/

---

## [2026-04-18] — Guide Profile Redesign (Split-Panel Layout) ✓ COMPLETE

**Type:** Major UI/UX Redesign
**Scope:** Guide listing portrait gallery, guide detail split-panel sidebar, infinite scroll pagination
**Build Status:** PASSING

### Changes Implemented
- Guides listing: Portrait gallery layout (replaced card-based)
- Guide detail: Split-panel sidebar (160-200px avatar + info column)
- Infinite scroll pagination via IntersectionObserver (replaced numbered pagination)
- Guide profile migration for years_experience field
- Cache revalidation hook integration
- Image blur data_url migration

### Related Commits
- a8001bd: Guide profile redesign commit
- 5b6ef59: Guide profile migration commit

---

## [2026-04-14] — Guides Data v2 Update ✓ COMPLETE

**Type:** Data Migration
**Scope:** Guides data v2 schema and import updates
**Build Status:** PASSING

### Changes
- Guides data v2 update processing
- Delta import support for guides
- Plan: 260414-guides-data-v2-update/

---

## [2026-04-13] — Tour Data v2 Delta Import ✓ COMPLETE

**Type:** Data Migration
**Scope:** Tour data v2 schema changes and delta import pipeline
**Build Status:** PASSING

### Changes
- Tour data v2 update processing
- Delta import pipeline for bulk updates (vs full reimport)
- Commit: 6c7d6d3

---

## [2026-04-12] — Cancellation Policy Page + Cache Revalidation ✓ COMPLETE

**Type:** Feature Addition + Infrastructure
**Scope:** New cancellation policy page with i18n, cache revalidation hooks
**Build Status:** PASSING

### Changes Implemented

**Cancellation Policy Page:**
- New page route: /cancellation (or /[locale]/cancellation)
- Full i18n support: EN, SV, DE
- Responsive design matching brand
- Commit: 00630d3

**Cache Revalidation System:**
- CMS afterChange hook: `revalidate-cache-tags-hook` (packages/cms/hooks/)
- Listens for tour/guide/category saves → calls /api/revalidate
- On-demand /api/revalidate endpoint (apps/web/app/api/revalidate/route.ts)
- Token-based authentication (X-Revalidate-Token header)
- Invalidates Next.js ISR tags for guides, tours, categories
- Commit: ddfc0ea (cache invalidation hook), 5e5e0b4 (/api/revalidate endpoint)

**Guide Profile Migration:**
- Added years_experience field to guides collection
- Payload migration: 20260212+ (approximate)

**Tour Duration Format Fix:**
- Corrected tour duration format on home page featured tours cards
- Commit: a5dfae7

---

## [2026-04-05] — Staging Crawler Blocking (IS_STAGING) ✓ COMPLETE

**Type:** SEO Infrastructure
**Scope:** Environment-based crawler blocking for staging environment
**Build Status:** PASSING

### Changes Implemented
- IS_STAGING environment variable (set on staging Vercel project only)
- robots.txt updated to disallow all crawlers when IS_STAGING=true
- Vercel headers configuration with X-Robots-Tag: noindex for staging
- Prevents search engine indexing of staging environment
- Commits: 202b562, 4f3128c

---

## [2026-04-04] — Tours Listing Redesign (Option B - Sidebar Filters) ✓ COMPLETE

**Type:** Major UI/UX Redesign
**Scope:** 2-column sidebar layout (desktop), horizontal cards (mobile), advanced filters
**Build Status:** PASSING (Next.js 16.2.3 Turbopack)

### Changes Implemented
- **Desktop Layout:** 260px fixed sidebar + flexible grid
- **Sidebar Filters:** Categories (multi-select), duration (single-select), price range (dual-thumb), accessibility
- **Page Header:** Full-width static bar with title, results, sort, view toggle
- **Mobile Design:** Filter header with search + pill, horizontal chips, updated filter drawer
- **Tour Cards:** Desktop vertical (180px image) vs mobile horizontal (130px height)
- **All filters:** URL-shareable params
- **Commit:** b552382

---

## [2026-04-02] — About Us Page Redesign ✓ COMPLETE

**Type:** Component Architecture Refactor
**Scope:** Split monolithic 187-line About page into 7 focused, reusable components
**Build Status:** PASSING (Next.js 16.2.3 Turbopack)

### Changes Implemented
- Split single about-us/page.tsx into 7 specialized section components
- Each component handles single responsibility
- page.tsx acts as thin orchestrator
- Updated: values-section.tsx redesigned for UI/UX consistency

### New Files Created
- about-hero-section.tsx, about-story-section.tsx, about-mission-vision-section.tsx
- about-responsible-tourism-section.tsx, about-certifications-section.tsx, about-cta-section.tsx

---

## [2026-04-01] — Custom 404 Error Page ✓ COMPLETE

**Type:** UI Feature Addition
**Scope:** Custom 404 page with i18n support and interactive elements
**Build Status:** PASSING (Next.js 16.2.3 Turbopack)

### Changes Implemented
- Custom 404 page component with i18n support (EN/SV/DE)
- Responsive design: Desktop 1440px, Mobile 390px
- Functional search bar redirecting to /tours?q=
- Location tags linking to /tours?city=
- Design images exported from Pencil design file
- Maintains brand consistency with Stepi-inspired aesthetic

### File Changes
- Created: apps/web/app/[locale]/not-found.tsx

---

## [2026-03-04] — Homepage Redesign (Stepi-Inspired Style) ✓ COMPLETE

**Type:** Major UI/UX Redesign
**Scope:** Homepage complete visual refresh matching Stepi aesthetic with heritage brand identity
**Build Status:** PASSING (Next.js 16.2.3 Turbopack)
**Tests:** 769/769 passed (93.76% coverage)

### Changes Implemented
- **7 Phases Completed:**
  1. Hero Section — Full-screen photo-forward design, centered white headline, single CTA
  2. Trust Signals — White-background 4-column icon grid with stats
  3. Video Highlight (NEW) — Scenic aerial photo with YouTube embed modal
  4. Featured Tours — Clean card redesign with portrait images, gold pricing, horizontal scroll mobile
  5. Seasonal CTA + Guides Preview — Gold gradient band + circular guide headshots
  6. Testimonials + Blog + Footer — Restyle testimonials, add blog grid, dark footer with gold accents
  7. Responsive Polish — Cross-section polish, performance, accessibility, integration

### Color Palette Adopted
| Role | Color | Usage |
|------|-------|-------|
| Primary Dark | #252525 | Headers, text, footer bg |
| Gold Accent | #d0ad50 | CTAs, buttons, emphasis |
| Gold Light | #DBC078 | Borders, accents |
| Gold Soft | #e6d3a0 | Badge bg, hover states |
| Coral | #E67E5A | Secondary CTAs (kept) |
| Footer BG | #0b0b0b | Dark footer |

---

## [2026-04-08] — Tour Detail Page Redesign (Booking-First) ✓ COMPLETE

**Type:** Major UI/UX Redesign
**Scope:** Booking-first layout with responsive image grid, price visibility on mobile, redesigned components
**Build Status:** PASSING (Next.js 16.2.3 Turbopack)

### Changes Implemented

**4 New Components Created:**
- `tour-image-grid.tsx` — Responsive image grid (replaces full-bleed hero)
- `tour-title-section.tsx` — Title, categories, meta row, mobile price bar (server component)
- `tour-highlights-section.tsx` — Dedicated highlights section (extracted from tour-content)
- `related-tour-card.tsx` — Compact horizontal card for related tours

**7 Components Redesigned:**
- `tour-hero.tsx` — Composes ImageGrid + Gallery (removed gradient overlay)
- `tour-content.tsx` — Experience text only + CSS-only Read More, no highlights
- `inclusions-section.tsx` — Colored cards with design token borders
- `logistics-section.tsx` — Alt bg card with map + label-value grid
- `guide-card.tsx` — Horizontal layout with avatar + credentials line
- `reviews-section.tsx` — Score badge header, cleaner italic cards
- `booking-section.tsx` — Price display, cancel badge, date/guest fields, styled CTA
- `related-tours.tsx` — Compact cards, 4-col grid, alt background

### Page Layout Changes

**New Grid Structure:**
```tsx
lg:grid-cols-[1fr_380px]  // Main content + sticky sidebar
```

**Component Order:**
1. TourHero (ImageGrid + Gallery)
2. TourTitleSection (title, categories, meta, price on mobile)
3. Border-top separator
4. Main content grid
5. TourHighlightsSection
6. TourContent (experience)
7. InclusionsSection
8. LogisticsSection
9. GuideCard
10. ReviewsSection
11. RelatedTours
12. BookingSection (sidebar, lazy-loaded)

### Key Features

- **Responsive Image Grid:** Displays tour images in a flexible grid layout instead of full-bleed hero
- **Booking Visibility:** Price bar on mobile title section for conversion optimization
- **Responsive Design:** Works across all breakpoints (375px–1440px+)
- **Translation Keys:** Added en/sv/de translations for new sections
- **Lazy Loading:** BookingSection dynamically imported for performance
- **Sticky Sidebar:** 380px right sidebar with booking widget on desktop

### Files Modified

- `page.tsx` — New grid layout, component reordering, border separator
- Translation files for new component labels

---

## [2026-04-04] — Tours Listing Page Redesign (Option B) ✓ COMPLETE

**Type:** Major UI/UX Redesign
**Scope:** 2-column sidebar layout (desktop), horizontal cards (mobile), advanced filters
**Build Status:** PASSING (Next.js 16.1.6 Turbopack)

### Changes Implemented

**5 Phases Completed:**
1. Page Layout & Header Redesign — Static page header with title, results, sort, view toggle + 2-column body (sidebar + grid)
2. Sidebar Filters Component — Desktop sidebar with categories, duration, price range slider, accessibility filters
3. Tour Card Redesign — Desktop grid cards with redesigned layout + responsive mobile horizontal cards
4. Mobile Header & Responsive — Mobile filter header with search + filter pill, category chips, filter drawer updates
5. Translations & Polish — Full i18n support (EN/SV/DE) + visual QA across breakpoints

### New Components Created
- `apps/web/components/tour/tour-page-header.tsx` — Desktop page header with results/sort/view controls
- `apps/web/components/tour/sidebar/sidebar-filters.tsx` — Main filter sidebar orchestrator
- `apps/web/components/tour/sidebar/filter-checkbox-group.tsx` — Reusable checkbox filter component
- `apps/web/components/tour/sidebar/price-range-slider.tsx` — Dual-thumb price range slider with debounce
- `apps/web/components/tour/view-mode-toggle.tsx` — Extracted grid/list toggle button

### Files Modified
- `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` — Updated layout structure
- `apps/web/app/(site)/[locale]/(frontend)/tours/tour-catalog-client.tsx` — Restructured to 2-column layout with sidebar slot
- `apps/web/components/tour/tour-card.tsx` — Redesigned for grid variant + responsive mobile horizontal layout
- `apps/web/components/tour/tour-grid-layout.tsx` — Updated responsive grid classes
- `apps/web/components/tour/filter-bar/filter-bar.tsx` — Removed desktop section, kept mobile-only
- `apps/web/components/tour/filter-bar/category-chips.tsx` — Updated chip styling (filled/border variants)
- `apps/web/components/tour/filter-drawer.tsx` — Added duration checkboxes, price range slider, accessibility options
- `apps/web/messages/{en,sv,de}.json` — New i18n keys for sidebar labels, duration options, etc.

### Key Features
- Desktop 2-column layout: 260px fixed sidebar + flexible grid
- Desktop page header: full-width static bar with title, results count, sort dropdown, view toggle
- Desktop sidebar filters: categories (multi-select), duration (single-select), price range (dual-thumb slider), accessibility
- Mobile: filter header with search + pill button, horizontal category chips, updated filter drawer
- Mobile cards: 130px height horizontal layout with image left, compact info right
- Desktop cards: vertical layout with 180px image, featured badge, duration pill, rating+price row
- All filters shareable via URL params
- Debounced price range updates to avoid excessive navigation
- Full responsive design 375px–1440px+ with CSS-only responsive behavior (no hydration mismatches)

### Translation Updates
- New keys under `tours.filters` namespace for: pageTitle, pageSubtitle, categories, allTours, priceRange, duration options, maxCapacity, durationAndCapacity
- Full localization: English, Swedish, German

### Validation
- Design spec: 2-column sidebar layout (desktop), horizontal cards (mobile)
- Price range bounds: hardcoded 0–2000 SEK per decision
- Hearing filter: hidden (API support TBD)
- Map button: hidden (feature not yet implemented)

---

## [2026-04-02] — About Us Page Redesign ✓ COMPLETE

**Type:** Component Architecture Refactor
**Scope:** Split monolithic 187-line About page into 7 focused, reusable components
**Build Status:** PASSING (Next.js 16.1.6 Turbopack)

### Changes Implemented

**Component Modularization:**
- Split single about-us/page.tsx into 7 specialized section components
- Each component handles single responsibility (hero, story, mission/vision, values, certifications, responsible tourism, CTA)
- page.tsx now acts as thin orchestrator importing and composing sections
- values-section.tsx redesigned for improved UI/UX consistency

**New Files Created:**
- `apps/web/components/pages/about-hero-section.tsx` - Hero with image & overlay
- `apps/web/components/pages/about-story-section.tsx` - Heritage narrative
- `apps/web/components/pages/about-mission-vision-section.tsx` - Mission/vision
- `apps/web/components/pages/about-responsible-tourism-section.tsx` - Sustainability
- `apps/web/components/pages/about-certifications-section.tsx` - Credentials
- `apps/web/components/pages/about-cta-section.tsx` - Call-to-action
- Updated: `apps/web/components/pages/values-section.tsx` (redesigned)

**Translation Updates:**
- New i18n keys added to messages/en.json, messages/sv.json, messages/de.json
- All components use t() with namespaced keys for full localization

**Benefits:**
- Improved code reusability (sections can be composed into different pages)
- Easier testing and maintenance for individual components
- Reduced complexity per file (follows 200 LOC guideline)
- Better component discoverability in codebase

---

## [2026-04-01] — Custom 404 Error Page ✓ COMPLETE

**Type:** UI Feature Addition
**Scope:** Custom 404 page with i18n support and interactive elements
**Build Status:** PASSING (Next.js 16.1.6 Turbopack)

### Changes Implemented

- Custom 404 page component with i18n support (EN/SV/DE)
- Responsive design: Desktop 1440px, Mobile 390px
- Functional search bar redirecting to `/tours?q=`
- Location tags linking to `/tours?city=`
- Design images exported from Pencil design file
- Maintains brand consistency with Stepi-inspired aesthetic

### File Changes

- Created: `apps/web/app/[locale]/not-found.tsx`
- Added design assets to public directory

---

## [2026-03-04] — Homepage Redesign (Stepi-Inspired Style) ✓ COMPLETE

**Type:** Major UI/UX Redesign
**Scope:** Homepage complete visual refresh matching Stepi aesthetic with heritage brand identity
**Build Status:** PASSING (Next.js 16.1.6 Turbopack)
**Tests:** 769/769 passed (93.76% coverage)

### Changes Implemented

**7 Phases Completed:**
1. Hero Section — Full-screen photo-forward design, centered white headline, single CTA
2. Trust Signals — Redesigned to white-background 4-column icon grid with stats
3. Video Highlight (NEW) — Scenic aerial photo with YouTube embed modal
4. Featured Tours — Clean card redesign with portrait images, gold pricing, horizontal scroll mobile
5. Seasonal CTA + Guides Preview — Gold gradient band + circular guide headshots
6. Testimonials + Blog + Footer — Restyle testimonials, add blog grid, dark footer with gold accents
7. Responsive Polish — Cross-section polish, performance, accessibility, integration

### Color Palette Adopted

| Role | Color | Usage |
|------|-------|-------|
| Primary Dark | #252525 | Headers, text, footer bg |
| Gold Accent | #d0ad50 | CTAs, buttons, emphasis |
| Gold Light | #DBC078 | Borders, accents |
| Gold Soft | #e6d3a0 | Badge bg, hover states |
| Coral | #E67E5A | Secondary CTAs (kept) |
| Footer BG | #0b0b0b | Dark footer |

### Post-Review Fixes Applied

- Footer Link import fixed (next/link → i18n Link)
- Hero heading switched to i18n key
- CSP frame-src updated for YouTube embeds

### Verification

- All 7 phases marked Complete with success criteria validated
- Plan.md status updated to "Complete"
- All phase files updated with checkmarks
- No new files created outside plans/ directory

---

## Previous Entries

(Add earlier changelogs here as project progresses)
