---
phase: 3
title: "Fix Contact Address"
status: completed
priority: P1
effort: "20m"
dependencies: []
---

# Phase 3: Fix Contact Address (Bug #3)

## Overview

The contact page shows TWO different addresses: the info card renders the **wrong** `Drottninggatan 5, 111 51 Stockholm`, while the map block directly below it renders the **correct** `Karlavägen 18, 114 31 Stockholm`. Remove the wrong one so only the correct address shows.

## Key Insight (root cause)

There are two address sources that drifted apart:
- **Wrong** address lives ONLY in i18n key `contact.info.addressValue` (`en/sv/de.json:1092`), rendered at `contact-info-section.tsx:24`.
- **Correct** address is the canonical constant `CONTACT_ADDRESS` / `CONTACT_ADDRESS_LINE` (`lib/contact-constants.ts`), already used by the footer, terms, imprint, Schema.org, the map link, AND the map block in this same component (line 91).

`contact-constants.ts` carries a comment marking it the validated single source of truth (decided 2026-04-25). The i18n value was simply never synced. Fix = point the info card at the constant and delete the stale i18n key, eliminating the dual source so it can't drift again.

## Related Code Files

- **Modify:** `apps/web/components/contact/contact-info-section.tsx`
  - Line 24: change `value: t('info.addressValue')` → `value: CONTACT_ADDRESS_LINE`. `CONTACT_ADDRESS_LINE` is already imported (line 5).
- **Modify:** `apps/web/messages/en.json` — remove `contact.info.addressValue` (line ~1092). Keep `addressLabel`.
- **Modify:** `apps/web/messages/sv.json` — remove `contact.info.addressValue` (line ~1092).
- **Modify:** `apps/web/messages/de.json` — remove `contact.info.addressValue` (line ~1092).

`addressValue` has exactly one consumer (verified: only `contact-info-section.tsx:24`), so removal is safe.

## Implementation Steps

1. In `contact-info-section.tsx`, replace the address `value` in the `infoItems` array (line 24) with the `CONTACT_ADDRESS_LINE` constant (already imported). Result: the info card and the map block both render `Karlavägen 18, 114 31 Stockholm`.
2. Delete the now-orphaned `addressValue` key from `en.json`, `sv.json`, `de.json` (keep `addressLabel`).
3. Grep `apps/web` for `addressValue`, `Drottninggatan`, `111 51` — expect zero hits in production code (plan/docs files may still reference it; leave those).
4. Type-check, lint, run contact tests.

## Success Criteria

- [ ] Contact page (`/en/contact`, `/sv/contact`, `/de/contact`) shows only `Karlavägen 18, 114 31 Stockholm` — info card and map block agree.
- [ ] `Drottninggatan 5` / `111 51` no longer appear anywhere in `apps/web` production code (grep clean).
- [ ] `contact.info.addressValue` removed from all three locale files; `addressLabel` retained; no missing-key warnings (component no longer reads `addressValue`).
- [ ] `npm run type-check` + `npm run lint` clean; contact component tests pass.

## Risk Assessment

- **Removing a key still referenced elsewhere** → confirmed single consumer; grep again post-edit to be safe (next-intl throws on missing keys).
- **Minimal alternative** (if avoiding a code change is preferred): instead of steps 1-2, just overwrite the three `addressValue` values with `Karlavägen 18, 114 31 Stockholm`. Leaves the dual-source drift risk in place — **not recommended**, but lower blast radius. Default to the constant-based fix above.
- **Other surfaces already correct** → footer, imprint, terms, Schema.org/JSON-LD all use the constant already; no changes needed there.
