---
title: "Guide Detail Page Redesign — Option B Split-Panel"
description: "Redesign guide detail page to split-panel layout with sidebar profile, bio column, 2-col tours grid, and mobile sticky CTA"
status: pending
priority: P2
effort: 6h
branch: master
tags: [redesign, guides, ui, responsive]
created: 2026-04-12
---

# Guide Detail Page Redesign

## Context
- [Design spec](research/researcher-01-design-spec.md)
- [Existing code analysis](research/researcher-02-existing-code-analysis.md)
- [Design guidelines](../../docs/design-guidelines.md)

## Architecture
Desktop: 450px fixed sidebar (profile) + flex-1 right column (breadcrumb, bio, tours grid).
Mobile: Single column — centered header section, bio, tours, sticky bottom CTA.

## Phases

| # | Phase | Est | Status | File |
|---|-------|-----|--------|------|
| 1 | Data layer — add `yearsExperience` to API + interface | 0.5h | Pending | [phase-01](phase-01-data-layer.md) |
| 2 | Guide sidebar component (core visual piece) | 1.5h | Pending | [phase-02](phase-02-guide-sidebar.md) |
| 3 | Bio section refactor + page layout rewrite | 1.5h | Pending | [phase-03](phase-03-bio-and-layout.md) |
| 4 | Tours section — 2-col grid, inline card style | 1h | Pending | [phase-04](phase-04-tours-section.md) |
| 5 | ~~Mobile sticky CTA~~ **SKIPPED** — no CTA per validation | 0h | Skipped | [phase-05](phase-05-mobile-cta.md) |
| 6 | i18n translations + credential icon mapping | 0.5h | Pending | [phase-06](phase-06-i18n-and-icons.md) |
| 7 | Testing + accessibility verification | 1.5h | Pending | [phase-07](phase-07-testing.md) |

## Dependency Graph
```
Phase 1 (data) ─┐
Phase 6 (i18n) ─┼─> Phase 2 (sidebar) ─┐
                 │                       ├─> Phase 3 (bio+layout) ─> Phase 5 (mobile CTA)
                 └─> Phase 4 (tours) ───┘
                                         └─> Phase 7 (testing)
```

## Rollback
Each phase touches distinct files. Revert = `git revert` per phase commit. No DB migration needed (yearsExperience column already exists).

## Validation Summary

**Validated:** 2026-04-12
**Questions asked:** 4

### Confirmed Decisions
- **CTA behavior**: No CTA anywhere — no desktop sidebar button, no mobile sticky bar. Page is informational; users navigate to tours via grid cards.
- **Tagline**: Removed — no tagline below guide name (design element dropped)
- **Specialization contrast**: Darken text to `#8B6914` on `#FEF3C7` bg (~4.6:1 ratio, passes WCAG AA)
- **Credential icon priority**: First-match-wins from ordered keyword array

### Action Items
- [ ] Phase 02: Remove desktop CTA button from sidebar entirely
- [ ] Phase 02: Remove tagline text element below guide name
- [ ] **Phase 05: SKIP ENTIRELY** — no sticky CTA component needed
- [ ] Phase 06: Remove `contactGuide` and `seeAvailableTours` translation keys (unused)
- [ ] Phase 02/07: Use `#8B6914` for specialization pill text instead of `--color-secondary-dark`

## Remaining Open Items
1. Hover/focus states — use existing project defaults (shadow-card-hover, underline on links)
2. Mobile footer — reuse existing Footer component unchanged
