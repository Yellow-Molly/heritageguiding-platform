# Phase 01 — Scaffolding, Config & Env Wiring

## Context Links
- Parent: [plan.md](./plan.md)
- Brainstorm: [../reports/brainstormer-260516-2135-multi-location-lighthouse-report.md](../reports/brainstormer-260516-2135-multi-location-lighthouse-report.md)
- Precedent: `scripts/generate-bokun-import.ts`, `scripts/lib/bokun-import-defaults.ts`

## Overview
- **Priority:** P1 (foundation for all subsequent phases)
- **Status:** not-started
- **Effort:** 30m

Lay down the static configuration, env wiring, and the orchestrator skeleton. No network calls yet — purely scaffolding that subsequent phases plug into.

## Key Insights
- `tsx` already in use for `generate-bokun-import.ts`; no new dev dependency required
- `.env.local` is project convention; `.env*` already gitignored
- WPT API key obtained free at https://www.webpagetest.org/getkey.php (manual, one-time)
- TourDetails URL needs a concrete slug — pick a published, stable tour and hard-code in config

## Requirements

### Functional
- Config module exports: 5 WPT locations, 3 pages with concrete URLs, 2 form factors, 3 runs per test, threshold constants for diff highlighting
- Env validator: reads `WPT_API_KEY` from `process.env`, fails fast with helpful error if missing or empty
- Orchestrator skeleton: parses CLI args (`--no-diff`, `--verbose`, `--dry-run`), prints config summary, exits cleanly (does not yet submit tests)

### Non-functional
- All new files under 200 LOC
- Match style of `scripts/generate-bokun-import.ts` (single quotes, no semicolons, ✓/✗ console output)
- Zero new runtime dependencies (only `dotenv` if not already available — check first)

## Architecture

```
scripts/lighthouse-multi-location.ts   ─── reads ───▶ wpt-config.ts
                                       ─── calls ───▶ env-validator (inline or wpt-config helper)
```

No network IO in this phase. Subsequent phases extend this orchestrator.

## Related Code Files

**Create:**
- `scripts/lighthouse-multi-location.ts` — orchestrator skeleton (~60 LOC at this phase, grows)
- `scripts/lib/wpt-config.ts` — pure config module (~60 LOC)

**Update:**
- `.env.local` — add `WPT_API_KEY=` placeholder (manual; user fills in)
- (Optional) `.env.example` — add `WPT_API_KEY=` placeholder line so the requirement is committed

**Read for context:**
- `scripts/generate-bokun-import.ts` — orchestrator style precedent
- `scripts/lib/bokun-import-defaults.ts` — config module style precedent

## Implementation Steps

1. Decide on TourDetails slug — pick a published tour (suggest stable like `/tours/stockholm-archipelago-private-tour` or whichever has reliable content). Confirm with `curl -I` it returns 200 on staging.
2. Create `scripts/lib/wpt-config.ts`:
   ```ts
   export const WPT_LOCATIONS = [
     { id: 'stockholm', wptId: 'Stockholm:Chrome', label: 'Stockholm' },
     { id: 'frankfurt', wptId: 'Frankfurt:Chrome', label: 'Frankfurt' },
     { id: 'london',    wptId: 'London:Chrome',    label: 'London' },
     { id: 'us-east',   wptId: 'ec2-us-east-1:Chrome',   label: 'US East (Virginia)' },
     { id: 'us-west',   wptId: 'ec2-us-west-1:Chrome',   label: 'US West (California)' },
   ] as const

   export const PAGES = [
     { id: 'home',         url: 'https://staging.privatetours.se/', label: 'Home' },
     { id: 'tour-listing', url: 'https://staging.privatetours.se/tours', label: 'Tour Listing' },
     { id: 'tour-details', url: 'https://staging.privatetours.se/tours/<chosen-slug>', label: 'Tour Details' },
   ] as const

   export const FORM_FACTORS = ['mobile', 'desktop'] as const
   export const RUNS_PER_TEST = 3

   export const DIFF_THRESHOLDS = {
     scoreAbs: 5,        // Lighthouse score ±5 = highlight
     lcpMs: 200,
     fcpMs: 150,
     ttfbMs: 100,
     cls: 0.02,
     tbtMs: 100,
   } as const

   export type LocationId = typeof WPT_LOCATIONS[number]['id']
   export type PageId     = typeof PAGES[number]['id']
   export type FormFactor = typeof FORM_FACTORS[number]
   ```
3. Inline a tiny env validator in `wpt-config.ts`:
   ```ts
   export function requireWptApiKey(): string {
     const key = process.env.WPT_API_KEY
     if (!key || !key.trim()) {
       throw new Error('WPT_API_KEY missing. Get a free key at https://www.webpagetest.org/getkey.php and add it to .env.local')
     }
     return key.trim()
   }
   ```
4. Create `scripts/lighthouse-multi-location.ts` skeleton:
   - JSDoc header (usage, reference to plan dir)
   - `parseArgs()` → `{ noDiff, verbose, dryRun }`
   - `main()`:
     - Load `.env.local` (use `dotenv/config` import if `dotenv` is installed; otherwise instruct user to source it / set env)
     - Call `requireWptApiKey()`
     - Print config summary (page count, location count, form factors, total tests = 30)
     - Stub: `console.log('Network calls implemented in next phase')`
     - Exit 0
   - Match existing logging style (✓/✗ symbols)
5. Add WPT_API_KEY to `.env.local` (user action, document in plan)
6. Smoke test:
   - `npx tsx scripts/lighthouse-multi-location.ts` (no key set) → fails with helpful message
   - Add `WPT_API_KEY=test` → succeeds, prints summary, exits 0

## Todo List

- [ ] Confirm staging tour slug (curl 200 check)
- [ ] Create `scripts/lib/wpt-config.ts` with locations/pages/form factors/thresholds
- [ ] Add `requireWptApiKey()` helper in same file
- [ ] Create `scripts/lighthouse-multi-location.ts` skeleton with arg parsing + config print
- [ ] Verify `dotenv` availability or document alternative env loading
- [ ] Manually add `WPT_API_KEY=` to `.env.local` placeholder line (user step)
- [ ] Smoke run: no key → error; with key → prints summary

## Success Criteria

1. `npx tsx scripts/lighthouse-multi-location.ts` runs without exception when key is set
2. Config print shows correct totals: 3 pages × 5 locations × 2 form factors = 30 tests planned
3. Missing key produces actionable error message linking to free signup
4. No network calls made at this phase
5. Files under 200 LOC each

## Risk Assessment

| Risk | Mitigation |
|---|---|
| `dotenv` not in dependency tree | Check `package.json`; if missing, document `set WPT_API_KEY=...` in script header as fallback; add `dotenv` only if necessary |
| Chosen tour slug returns 404 in future | Document in `wpt-config.ts` as `// Update if this slug is decommissioned` |
| User commits real WPT_API_KEY by accident | `.env.local` already gitignored; verify before phase ends |

## Security Considerations
- API key never logged; only its presence checked
- No secrets in `.env.example`

## Next Steps
Phase 02 — WPT API client (submit + poll) builds on this skeleton.
