# Phase 04 — HTML Report Renderer

## Context Links
- Parent: [plan.md](./plan.md)
- Depends on: [phase-03-result-fetcher-parser.md](./phase-03-result-fetcher-parser.md)
- Used by: [phase-05-diff-vs-previous-run.md](./phase-05-diff-vs-previous-run.md), [phase-06-baseline-run-and-docs.md](./phase-06-baseline-run-and-docs.md)
- Carries over from predecessor: `plans/260516-2135-multi-location-lighthouse-report/phase-04-html-report-renderer.md` (minimal changes; data shape identical)

## Overview
- **Priority:** P1
- **Status:** not-started
- **Effort:** 1-1.5h

Render `SummaryFile` to a self-contained HTML dashboard. No external CSS, no JS dependencies, no CDN requests — opens standalone in any browser. Diff overlay added in Phase 05; this phase produces a clean single-run dashboard first.

## Key Insights
- Self-contained = all CSS inline in `<style>`, all icons as inline SVG, no `<script>` (or one tiny inline script for tab switching only)
- Tabbed mobile/desktop view: lightweight `<details>`/`<summary>` — zero JS option preferred for KISS
- A11y findings are deterministic by page — merge mobile + desktop a11y audits, dedupe by `id`, render once per page
- Lighthouse colour bands: ≥90 green (`#0c6`), 50–89 amber (`#fa3`), <50 red (`#f33`), null grey (`#999`)
- New header note: indicate this dashboard was generated via WPT Starter (free-tier UI submission) for reproducibility transparency

## Requirements

### Functional
- `renderReport(summary, previousSummary?)` → returns HTML string
- Header section: timestamp, git SHA (short), staging URL, total submissions / success / failed, run duration, link to previous run if present, **"WPT Starter free tier"** badge
- Per-page section, three pages, in this order: Home → Tour Listing → Tour Details
- Each page section contains:
  - **Scores grid**: rows = location (5), columns = Perf / A11y / BP / SEO, two side-by-side mini-tables for mobile + desktop
  - **CWV table**: rows = location, columns = TTFB / FCP / LCP / TBT / CLS / SI, one block per form factor
  - **A11y findings**: deduped list of failed audits for that page across all locations + form factors, severity badges, links to WPT report URLs for evidence
- **TourDetails caveat block**: callout explaining Bokun widget dominates LCP and the score reflects third-party load, not the host page
- Footer: row of WPT report links per submission for deep-dive
- Failed entries shown as "—" cells; never break layout

### Non-functional
- File < 2MB, no embedded images larger than data: SVGs
- Renders identically in Chrome / Firefox / Safari
- Print stylesheet not required; readable B&W if printed
- No JS dependencies; ≤30 LOC inline JS for tab toggling acceptable; `<details>` preferred

## Architecture

```
SummaryFile + previousSummary?
        │
        ▼
   report-builder.ts (orchestrates per-page sections, computes derived data)
        │
        ▼
   report-template.ts (pure functions: header/section/grid/cwv-table/a11y-list/footer)
        │
        ▼
   HTML string ──▶ fs.writeFileSync(perf/<run-dir>/index.html)
```

Split between builder (logic) and template (string assembly) keeps each file under 200 LOC.

## Related Code Files

**Create:**
- `scripts/lib/report-builder.ts` (~120 LOC) — aggregations, derived data, calls template functions
- `scripts/lib/report-template.ts` (~180 LOC) — HTML/CSS strings, atom-level render helpers

**Update:**
- `scripts/lighthouse-multi-location.ts` — after writing `summary.json`, call `renderReport(summary)` and write `index.html`

**Read for context:**
- `scripts/lib/wpt-result-parser.ts` types (Phase 03)

## Implementation Steps

1. In `report-template.ts`:
   - `htmlShell({ title, body })` — full `<!doctype html>` + `<style>` block + body
   - Inline CSS: ~80 lines, sober palette, monospace numerics, fixed-width score badges, responsive max-width 1200px container
   - `scoreBadge(value)` → coloured pill
   - `metricCell(value, unit)` → `1245 ms` / `—`
   - `severityBadge(severity)` → red/amber/grey pill
   - `freeTierBadge()` → small grey pill: "WPT Starter (free tier)"
2. In `report-builder.ts`:
   - `groupByPage(runs)` → `Map<PageId, RunSummary[]>`
   - `mergeA11y(runs)` → deduped audit list (by `id`), worst severity wins, sum failingNodes
   - `renderHeader(summary)` — includes `freeTierBadge()`
   - `renderPageSection(pageRuns)` — calls `renderScoresGrid`, `renderCwvTable`, `renderA11ySection`
   - `renderScoresGrid(runs)` — split by `formFactor`, two side-by-side tables
   - `renderCwvTable(runs)` — single table, one row per (location, formFactor)
   - `renderA11ySection(audits)` — collapsible list
   - `renderBokunCaveat()` — emitted only inside Tour Details section
   - `renderFooter(summary)` — link list
   - `renderReport(summary, previousSummary?)` — top-level
3. Tab UX choice: use HTML `<details open>` for each form-factor block — zero JS, works everywhere
4. Wire orchestrator: after `summary.json` write, call `renderReport(summary)` (pass `previousSummary` as `null` for now; Phase 05 wires it)
5. Visual smoke: open `perf/multi-location-*/index.html` in a browser, inspect grid alignment, badge colours, missing-data rendering with synthetic failed entries

## Todo List

- [ ] Create `report-template.ts` with shell + atom helpers (scoreBadge, metricCell, severityBadge, freeTierBadge, htmlShell)
- [ ] Create `report-builder.ts` with `renderReport` + per-section renderers
- [ ] Implement a11y dedupe across locations + form factors per page
- [ ] Add Bokun caveat block inside Tour Details only
- [ ] Wire orchestrator to write `index.html`
- [ ] Test visual with real summary from Phase 02/03 smoke
- [ ] Test layout with synthetic failed entries (`status:'failed'`)

## Success Criteria

1. `index.html` opens in browser without errors; all assets inline
2. Three page sections render in correct order
3. Scores grid: 5 rows × 4 columns × 2 form factors per page, colour-coded correctly
4. CWV table: numeric values right-aligned, units displayed, "—" for nulls
5. A11y findings list shows deduped audits with severity badges and node counts
6. Bokun caveat callout appears only on Tour Details
7. Header shows timestamp, git SHA, staging URL, success/failed counts, "WPT Starter (free tier)" badge
8. Footer link list links to WPT public report URLs
9. File total under 2MB
10. Visual sanity-check passes in Chrome + Firefox

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Layout breaks on narrow screens | Min-width 320 viewport meta; flex wrap on grids |
| Score colours wrong in print | Add print stylesheet with `-webkit-print-color-adjust: exact` |
| A11y audit list becomes massive (50+ items) | Sort by severity then failingNodes desc; collapse with `<details>` |
| Long page slugs overflow header | `text-overflow: ellipsis` on URL display, `title=` for full URL |
| Inline CSS conflicts with browser defaults | CSS reset block at top of stylesheet |

## Security Considerations
- All dynamic content HTML-escaped before insertion (tiny `esc()` helper)
- No `eval`, no remote scripts, no inline event handlers
- Safe even if served from a misconfigured host

## Next Steps
Phase 05 — diff-vs-previous-run overlay added to renderer.
