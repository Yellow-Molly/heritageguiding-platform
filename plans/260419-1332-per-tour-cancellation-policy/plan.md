---
title: "Per-Tour Cancellation Policy Migration"
description: "Migrate from single platform-wide cancellation policy to per-tour policies sourced from Bokun; redesign tour detail, FAQ, and /cancellation pages for consistency"
status: pending
priority: P1
effort: 8-12h
branch: master
tags: [cms, bokun, tour-detail, cancellation, i18n, faq]
created: 2026-04-19
blockedBy: [260506-2220-faq-content-update]
blocks: []
---

# Per-Tour Cancellation Policy Migration

## Summary

Replace global cancellation model with per-tour policies. Source of truth: Bokun. Mirror into Tour CMS collection as structured rules (cutoff hours + refund %). Tour detail becomes authoritative; `/cancellation` page becomes framework explainer; FAQ defers to tour pages.

## Context

- **Brainstorm:** [`reports/brainstorm-260418-1450-per-tour-cancellation-policy.md`](../reports/brainstorm-260418-1450-per-tour-cancellation-policy.md) (design brief, all key decisions locked)
- **Related:** `plans/260412-2254-cancellation-policy-page/` — built the global /cancellation page; this plan rewrites its copy only, reuses all 6 components.
- **Related:** `plans/260413-1710-tour-data-v2-update/` — import pipeline that this plan extends.

## Architecture (one-liner)

```
Bokun API ──sync script──▶ Tour.cancellationPolicy (CMS)
                                │
                                ├─▶ Tour detail: sidebar badge + dedicated section (authoritative)
                                ├─▶ /cancellation page: framework explainer (points to tours)
                                └─▶ FAQ: generic Q&As link to tours
```

## Phases

| # | Phase | Status | Effort | Dependencies |
|---|-------|--------|--------|--------------|
| 01 | [Discovery & Bokun API verification](./phase-01-discovery-and-bokun-api-verification.md) | pending | 1-2h | — |
| 02 | [Tour schema + global default fallback](./phase-02-tour-schema-and-default-fallback.md) | pending | 1-2h | 01 |
| 03 | [Bokun cancellation sync script](./phase-03-bokun-cancellation-sync-script.md) | pending | 2h | 02 |
| 04 | [Tour detail UI — badge + section](./phase-04-tour-detail-badge-and-section.md) | pending | 2-3h | 02 |
| 05 | [/cancellation page copy rewrite](./phase-05-cancellation-page-copy-rewrite.md) | pending | 1h | 04 (UX alignment) |
| 06 | [FAQ cancellation Q&A rewrite](./phase-06-faq-cancellation-rewrite.md) | superseded by 260506-2220-faq-content-update | 30m | 04 |
| 07 | [QA, drift verification, launch](./phase-07-qa-and-launch.md) | pending | 1h | 03,04,05,06 |

## Key Dependencies

- Bokun API access for experience cancellation terms (credentials, endpoint).
- Payload migration on `cancellationPolicy` field addition (backfill empty, no data loss).
- Translator review for rewritten FAQ + /cancellation copy (en/sv/de).

## Risks

1. **Bokun API shape mismatch** — Phase 01 exists to de-risk before schema locks.
2. **Non-standard policies** (per-date, group-size) won't fit `{hours, %}` — audit in Phase 01; may require schema adjustment or escape hatch via `notes`.
3. **Sync drift** — Bokun policy changes silently between syncs. Admin surfaces `bokunSyncedAt`; consider scheduled sync post-MVP.
4. **Contradiction with Bokun widget** — microcopy "Final terms confirmed at checkout" on every display.

## Success Criteria

- All tours with Bokun IDs display correct per-tour cancellation terms matching Bokun checkout.
- Inquiry tours fall back to global default without broken UI.
- FAQ + /cancellation do not contradict tour pages.
- Zero new i18n placeholder gaps in en/sv/de.
- Sync script reproducible; documented in `docs/deployment-guide.md` or equivalent.
