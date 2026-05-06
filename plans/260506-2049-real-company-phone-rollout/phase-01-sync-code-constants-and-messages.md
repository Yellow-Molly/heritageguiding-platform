# Phase 01 — Sync Code Constants & i18n Messages

**Priority:** High
**Status:** Completed (2026-05-06)
**Effort:** ~10 min

## Overview

Replace placeholder phone `+46 70 123 45 67` with real number `+46 72 441 19 01` in code-level fallback and translation files. Pure string substitution, no architectural change.

## Files to Modify

### 1. `apps/web/lib/contact-constants.ts:13`

```diff
 export const CONTACT_PHONE =
-  process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '+46 70 123 45 67'
+  process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '+46 72 441 19 01'
```

`CONTACT_PHONE_TEL` derives `+46724411901` automatically via the regex below it — no extra change.

### 2. `apps/web/messages/en.json:880`

```diff
-      "phoneValue": "+46 70 123 45 67",
+      "phoneValue": "+46 72 441 19 01",
```

### 3. `apps/web/messages/sv.json:880`

```diff
-      "phoneValue": "+46 70 123 45 67",
+      "phoneValue": "+46 72 441 19 01",
```

### 4. `apps/web/messages/de.json:880`

```diff
-      "phoneValue": "+46 70 123 45 67",
+      "phoneValue": "+46 72 441 19 01",
```

### Decision: `phonePlaceholder` (line 853 each locale)

Currently `"+46"` — input field placeholder hint, not a real number. **Leave as-is.** Changing it to the full company number would mislead users into submitting our own number.

## Implementation Steps

1. Edit `apps/web/lib/contact-constants.ts` line 13
2. Edit `apps/web/messages/en.json` line 880
3. Edit `apps/web/messages/sv.json` line 880
4. Edit `apps/web/messages/de.json` line 880
5. Run typecheck (`npm run typecheck` or `tsc --noEmit` in `apps/web`)
6. Visual smoke test:
   - `npm run dev` in `apps/web`
   - Open `/en`, `/sv`, `/de` — footer phone link
   - Open `/contact` in each locale — info card phone row
   - Click `tel:` link → confirms `+46724411901`
7. Verify schema.org JSON-LD on `/contact` (view source, search for `telephone`)

## Todo List

- [x] Update `CONTACT_PHONE` default in `contact-constants.ts`
- [x] Update `phoneValue` in `messages/en.json`
- [x] Update `phoneValue` in `messages/sv.json`
- [x] Update `phoneValue` in `messages/de.json`
- [x] Typecheck (no new errors introduced; pre-existing AI-chat + test type issues unrelated)
- [x] Affected unit tests pass (`contact-form` 9/9, `whatsapp-floating-button` 8/8)
- [ ] **(manual)** Footer renders new number in all three locales — visual smoke
- [ ] **(manual)** Contact page renders new number in all three locales — visual smoke
- [ ] **(manual)** Cancellation page renders new number — visual smoke
- [ ] **(manual)** `tel:` href = `tel:+46724411901` — DOM check
- [ ] **(manual)** Schema.org `telephone` = `+46724411901` on `/contact` page — view source

## Success Criteria

- Zero remaining hits for `+46 70 123 45 67` or `+46701234567` outside test fixtures and archived plan docs
- Browser dev test in all 3 locales shows new number
- No TypeScript errors

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| i18n message key drift between locales | All three updated in same commit |
| Stale Vercel env var still overrides default | Phase 02 handles env layer; until then prod may show old value if env is set |
| Cached static pages | ISR/Cache invalidates on deploy |

## Out of Scope

- Test fixtures (`+46701234567`) — synthetic data
- Refactoring `phoneValue` → `CONTACT_PHONE` consolidation
- Pencil design file `pencils/contact.pen`
