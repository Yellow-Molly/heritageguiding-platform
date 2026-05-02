---
phase: 06
title: Cleanup Measurement + Docs Sync
status: docs synced; instrumentation removal deferred until query-optimization follow-ups ship
priority: medium
effort: 20m
depends: [05, follow-up perf issues]
---

# Phase 06 — Cleanup Measurement + Docs Sync

## Context Links
- Brainstorm: `plans/reports/brainstorm-260501-1949-instant-filter-feedback.md`
- Phase 01 baselines: `plans/260502-0048-instant-filter-feedback/baselines/`

## Overview
**Priority:** Medium
**Status:** Deferred. Phase 01 outcome: BLOCK band on both routes (`getTours` p95 1396ms, `getGuideFilterOptions` p95 821ms). Instrumentation must remain in place for the follow-up perf optimization work to validate against; this phase runs only after those follow-ups ship and the baselines are re-captured.

Apply the Phase 01 decision rule. Remove or convert temporary instrumentation. Update docs.

## Key Insights
- Decision rule (from brainstorm):
  - p95 < 300ms → remove instrumentation entirely, ship as-is
  - 300–800ms → remove instrumentation, open follow-up issue for query optimization (linked to baselines)
  - \> 800ms → block ship; optimization happens before merge (this phase becomes blocking)
- New filter-state pattern is reusable across listing pages → docs/code-standards.md should record the pattern as canonical

## Requirements
**Functional**
- Remove or convert temp Server-Timing in `tours/page.tsx` and `guides/page.tsx`
- Update `docs/code-standards.md` with FilterStateProvider pattern
- Update `docs/system-architecture.md` if listing flow diagrams exist
- Update `docs/project-changelog.md` with this work item

**Non-functional**
- No leftover `console.time` calls in committed code
- Docs entries kept concise (<10 lines each)

## Architecture
N/A (cleanup + docs)

## Related Code Files
**Modified:**
- `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` — remove Server-Timing
- `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx` — remove Server-Timing
- `docs/code-standards.md` — add "URL-state listing filters" section
- `docs/project-changelog.md` — add entry
- `docs/system-architecture.md` — update if relevant

**Optional:**
- GitHub issue for query optimization (if 300–800ms band hit)

## Implementation Steps
1. Read Phase 01 baseline files; determine band (< 300 / 300–800 / > 800)
2. **All bands:** Remove Server-Timing instrumentation from both `page.tsx` files (clean revert of Phase 01 code mods)
3. **If 300–800ms:** Use `gh issue create` to open follow-up:
   - Title: `perf(listing): optimize getTours/getGuides query (p95 ~XXXms)`
   - Body: links baseline files + decision rule + suggested next steps (DB index check, n+1 audit on category/city joins)
4. **If > 800ms:** Block this phase. Do NOT remove instrumentation. Escalate to user with baseline data + recommend opening dedicated optimization plan
5. Update `docs/code-standards.md`:
   ```
   ### URL-state listing filters
   Listing pages with URL-driven filters use a single `<FilterStateProvider>` (`apps/web/components/tour/filter-state-provider.tsx`) that owns:
   - `useOptimistic` over `searchParams.toString()` for instant UI flip
   - `useTransition` wrapping `router.push`/`router.replace` for server roundtrip
   - API: `setParam`, `toggleListItem`, `clearAll`, `params`, `isPending`
   Consumers call `useFilterState()` instead of `useSearchParams + useRouter + usePathname`. Grids render `<GridPendingOverlay>` driven by `isPending`.
   ```
6. Add changelog entry (date + slug + 1-line summary + link to plan)
7. Update `system-architecture.md` if listing-flow section exists

## Todo List
- [ ] Read baseline files; determine band
- [ ] Remove Server-Timing from `tours/page.tsx`
- [ ] Remove Server-Timing from `guides/page.tsx`
- [ ] (If 300–800ms band) Open follow-up GitHub issue
- [ ] (If >800ms band) STOP — escalate to user
- [ ] Update `docs/code-standards.md`
- [ ] Update `docs/project-changelog.md`
- [ ] Update `docs/system-architecture.md` (if applicable)
- [ ] `npm run typecheck` clean after cleanup
- [ ] Final commit

## Success Criteria
- No Server-Timing or `console.time` debug code in committed `page.tsx` files
- Docs reflect new pattern
- If applicable: follow-up issue exists and links to baselines
- All checks pass

## Risk Assessment
- **Risk:** Forgetting to remove instrumentation before merge. **Mitigation:** Grep for `Server-Timing` and `console.time` in `page.tsx` files before final commit
- **Risk:** Decision rule misapplied (e.g., outlier sample skews p95). **Mitigation:** Phase 01 took 5 samples per route; if variance high, take 3 more before deciding

## Security
- Confirm no debug instrumentation leaks DB internals or query text into headers

## Next Steps
- Plan complete after this phase
- Run `/ck:plan archive` to journal + archive
