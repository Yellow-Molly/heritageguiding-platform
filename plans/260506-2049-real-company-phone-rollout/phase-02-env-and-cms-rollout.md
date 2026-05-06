# Phase 02 — Env + CMS Operational Rollout

**Priority:** Medium (operational, not code-blocking)
**Status:** Completed (2026-05-06) — Vercel env set, CMS updated, prod redeployed, phone verified live
**Effort:** ~5 min code + Vercel/CMS admin actions
**Depends on:** Phase 01

## Overview

Document the override env vars and propagate the real phone to runtime systems (Vercel env, Payload CMS Site Settings). Phase 01 already makes the code default correct, so this phase is belt-and-suspenders + WhatsApp coverage.

## Files to Modify

### 1. `apps/web/.env.example`

Add a `Contact` section. Insert after the `# i18n` block at the end:

```diff
 # i18n
 DEFAULT_LOCALE=en
 SUPPORTED_LOCALES=sv,en,de
+
+# Contact (overrides defaults in apps/web/lib/contact-constants.ts)
+# Used by footer, contact page, schema.org JSON-LD
+NEXT_PUBLIC_CONTACT_PHONE=+46 72 441 19 01
+NEXT_PUBLIC_CONTACT_EMAIL=info@privatetours.se
+
+# WhatsApp floating button (international format, no `+`, no spaces)
+# Falls back to Payload CMS site-settings.whatsappNumber if unset
+WHATSAPP_NUMBER=46724411901
```

## Operational Actions (Outside Code)

### Vercel — Production + Preview Env

```
NEXT_PUBLIC_CONTACT_PHONE=+46 72 441 19 01
WHATSAPP_NUMBER=46724411901
```

Set via:
- `vercel env add NEXT_PUBLIC_CONTACT_PHONE production`
- `vercel env add NEXT_PUBLIC_CONTACT_PHONE preview`
- `vercel env add WHATSAPP_NUMBER production`
- `vercel env add WHATSAPP_NUMBER preview`
- Redeploy required for `NEXT_PUBLIC_*` (inlined at build time)

### Payload CMS — Site Settings

Admin UI → Globals → Site Settings → `whatsappNumber` field → set to `46724411901` (no `+`, per the field's admin description).

This drives `apps/web/lib/get-whatsapp-number-from-cms.ts` for the floating WhatsApp button. CMS value takes precedence over `WHATSAPP_NUMBER` env.

## Implementation Steps

1. Update `apps/web/.env.example` with new section
2. Set Vercel env vars (production + preview) via CLI or dashboard
3. Set CMS Site Settings `whatsappNumber` in Payload admin (production DB)
4. Trigger production redeploy (env-var changes → fresh build needed)
5. Verify post-deploy:
   - `https://privatetours.se/en` footer phone
   - `https://privatetours.se/contact` info card phone
   - WhatsApp floating button click-through opens `wa.me/46724411901`

## Todo List

- [x] Update `apps/web/.env.example`
- [x] **(user)** Set `NEXT_PUBLIC_CONTACT_PHONE` in Vercel (production)
- [x] **(user)** Set `NEXT_PUBLIC_CONTACT_PHONE` in Vercel (preview)
- [x] **(user)** Set `WHATSAPP_NUMBER` in Vercel (production)
- [x] **(user)** Set `WHATSAPP_NUMBER` in Vercel (preview)
- [x] **(user)** Update Payload CMS Site Settings → `whatsappNumber`
- [x] **(user)** Trigger production redeploy
- [x] **(user)** Verify production footer shows real number
- [x] **(user)** Verify production WhatsApp button opens correct chat

## Success Criteria

- `vercel env ls` confirms vars are set in `production` and `preview`
- Live production site renders `+46 72 441 19 01`
- WhatsApp button click opens `https://wa.me/46724411901` (or equivalent)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Forgot to redeploy after setting `NEXT_PUBLIC_*` | Phase 01 default already correct → fallback kicks in |
| WhatsApp number format wrong (with `+` or spaces) | Field admin hint explicit; verify after save |
| Stale CMS cache shows old WhatsApp | Restart Payload / clear edge cache after save |

## Security / Privacy Considerations

- Phone number is publicly disclosed on the website — no secret-handling concern
- `WHATSAPP_NUMBER` not prefixed with `NEXT_PUBLIC_` because it is read server-side via the CMS fetcher (`get-whatsapp-number-from-cms.ts`). The fetcher result is passed as a prop into the Client Component `WhatsAppFloatingButton` from a server parent, so the value reaches the browser via React serialization — no env-var bundling needed. Keep as-is.

## Format Notes (Confirmed)

WhatsApp link is `https://wa.me/${phoneNumber}` (see `apps/web/components/shared/whatsapp-floating-button.tsx:50`). Per `wa.me` spec, the number must be **digits only — no `+`, no spaces, no dashes**. Same number is used for voice and WhatsApp:

| Variable | Value | Format |
|----------|-------|--------|
| `NEXT_PUBLIC_CONTACT_PHONE` | `+46 72 441 19 01` | Display, with `+` and spaces |
| `WHATSAPP_NUMBER` | `46724411901` | Digits only |
| CMS `whatsappNumber` | `46724411901` | Digits only |
