---
phase: 06
title: "Operator SOP — Bokun Extras Setup Documentation"
status: complete
priority: P2
effort: 30m
blockedBy: []
completed: 2026-05-25
---

# Phase 06 — Operator SOP for Bokun Extras Setup

## Context Links

- Existing operator docs pattern: `docs/deployment-guide.md`, `docs/project-overview-pdr.md`
- Brainstorm: `plans/reports/brainstorm-260519-2046-bokun-extras-add-ons-checkout.md`

## Overview

**Priority:** P2
**Status:** complete (2026-05-25) — `docs/bokun-extras-setup.md` shipped (130 lines); includes the "Price is per pricing category" rate-toggle trap discovered + recovered from during Phase 01

Short SOP doc that walks the operator through the manual workflow: configure an Extra in Bokun dashboard, then mirror it in CMS. Anchors the whole "manual sync" model so future ops folks understand the contract.

## Key Insights

- Doc lives under `docs/` (project docs root) — not under `plans/` (which is for in-flight work)
- Keep under ~80 lines, screenshot-light, copy-pasteable steps
- Mention the v1 limitation clearly: **CMS is informational; Bokun is truth for price/availability**

## Requirements

**Functional:**
- Steps to create extra in Bokun dashboard (per-person, adult/child, required/optional)
- Steps to copy extra ID
- Steps to mirror in Payload CMS Tours editor
- Verification step: load tour page on staging, place a sandbox booking with the extra
- Troubleshooting: "I see the row in CMS but not in widget" / "price in CMS differs from Bokun"

**Non-functional:**
- Written so a non-developer ops person can follow without engineering help

## Architecture

Single markdown file. Outline:

1. **Background** (3 lines) — what Bokun Extras are, why we mirror in CMS
2. **Prerequisites** — Bokun login, Payload admin access, tour already linked to Bokun (has `bokunExperienceId`)
3. **Step 1 — Bokun dashboard** — create the extra (links to Bokun docs, screenshots if available)
4. **Step 2 — Copy extra ID** — where to find it
5. **Step 3 — Payload CMS** — open tour → Optional Add-ons → add row → fill fields → paste ID → save
6. **Step 4 — Localize** — switch locale in Payload, translate `name` + `description` for sv/en/de (and in Bokun if Bokun does per-channel translations; flag the unresolved question)
7. **Step 5 — Verify** — load tour page on staging in 3 locales; place a sandbox booking with the extra; confirm booking record shows add-on in admin
8. **Troubleshooting**
9. **Limitations (v1)** — no auto-sync; price drift requires manual reconciliation; phase-2 push-sync is a future plan

## Related Code Files

**Create:**
- `docs/bokun-extras-setup.md`

**Modify (optional, only if it improves discoverability):**
- `docs/codebase-summary.md` — add one-line pointer to the new SOP

## Implementation Steps

1. Draft `docs/bokun-extras-setup.md` per outline above
2. Cross-link from Phase 02 admin warning copy if a "more info" link makes sense (`docs/bokun-extras-setup.md`)
3. Add a single pointer line in `docs/codebase-summary.md` under integrations section
4. Review with operator (or stub for review) — capture any gaps in language

## Todo List

- [x] `docs/bokun-extras-setup.md` drafted (130 lines)
- [ ] Linked from `docs/codebase-summary.md` (skipped per YAGNI — matches `bokun-cart-css-customization.md` precedent which is also not cross-linked)
- [ ] Operator review pass (pending — schedule when convenient)

**Sections in the final doc:**
- Prerequisites
- ⚠️ Critical warning (the rate-toggle trap that broke 10 tours during Phase 01)
- Step 1: Create extra in Bokun
- Step 2: Copy Extra ID (URL trick)
- Step 3: Mirror in CMS (all 9 fields explained)
- Step 4: Localize sv/en/de
- Step 5: Verify end-to-end (tour page → widget → sandbox booking → admin → email)
- Troubleshooting (6-symptom matrix)
- Limitations (v1) + Phase-2 candidates

## Success Criteria

- Operator following only this doc can configure one extra end-to-end without engineering help
- Troubleshooting section covers the two most likely failure modes (unwired ID, price mismatch)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Bokun UI screenshots go stale | Keep screenshots minimal; rely on Bokun's own docs URL |
| Operator skips localization step | Bullet-list step 4 explicitly; CMS admin shows missing locales |

## Security Considerations

- None — public-facing operational doc, no secrets

## Next Steps

- If Phase 2 (CMS→Bokun push sync) lands, replace manual steps 1–4 with "edit in CMS; sync runs automatically"

## Unresolved Questions

- Bokun's localization model for extra names — pending Phase 01 confirmation. Doc must note whichever path applies (per-product translation form vs per-channel-language).
