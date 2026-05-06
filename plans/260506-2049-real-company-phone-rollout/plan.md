---
name: Real Company Phone Rollout
slug: real-company-phone-rollout
created: 2026-05-06
status: in-progress
mode: fast
blockedBy: []
blocks: []
---

# Real Company Phone Rollout

Replace placeholder phone `+46 70 123 45 67` with real number **`+46 72 441 19 01`** across all customer-facing surfaces and the canonical contact source of truth.

## Scope

Display strings only — test fixtures (`+46701234567`) are synthetic and stay as-is.

## Real Number Variants

| Form | Value | Where used |
|------|-------|------------|
| Display | `+46 72 441 19 01` | Footer, contact page, i18n messages, `NEXT_PUBLIC_CONTACT_PHONE` |
| `tel:` link | `+46724411901` | derived via `CONTACT_PHONE_TEL` regex |
| Schema.org `telephone` | `+46724411901` | derived from `CONTACT_PHONE_TEL` |
| WhatsApp (`wa.me/...`, digits only — no `+`, no spaces) | `46724411901` | `WHATSAPP_NUMBER` env, CMS `whatsappNumber` |

**Confirmed:** Same number used for voice and WhatsApp business.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Sync code constants & i18n messages](phase-01-sync-code-constants-and-messages.md) | completed (2026-05-06) |
| 2 | [Env + CMS operational rollout](phase-02-env-and-cms-rollout.md) | code + Vercel env + CMS done (2026-05-06); only redeploy & post-deploy verification pending |

## Key Files

**Source of truth (code):**
- `apps/web/lib/contact-constants.ts` — `CONTACT_PHONE` default
- `apps/web/messages/en.json` — `contact.info.phoneValue`, `forms.phonePlaceholder`
- `apps/web/messages/sv.json` — same keys
- `apps/web/messages/de.json` — same keys

**Operational (env / CMS):**
- `apps/web/.env.example` — document `NEXT_PUBLIC_CONTACT_PHONE` and `WHATSAPP_NUMBER`
- Vercel project env vars (preview + production)
- Payload CMS Site Settings → `whatsappNumber` field

**Verification surfaces (no code change, must visually verify):**
- `apps/web/components/layout/footer.tsx` (uses `CONTACT_PHONE` constant)
- `apps/web/components/contact/contact-info-section.tsx` (uses `t('info.phoneValue')`)
- `apps/web/components/seo/travel-agency-schema.tsx` (uses `CONTACT_PHONE_TEL`)
- `apps/web/components/seo/contact-page-schema.tsx` (uses `CONTACT_PHONE_TEL`)
- `apps/web/app/(site)/[locale]/(frontend)/cancellation/page.tsx` (uses `CONTACT_PHONE`)

## Out of Scope

- Test fixtures in `apps/web/lib/email/__tests__/`, `apps/web/lib/api/__tests__/`, `apps/web/lib/bokun/__tests__/`, `apps/web/app/api/contact/__tests__/`, `apps/web/app/api/group-inquiry/__tests__/` — synthetic data, no behavioural impact
- `pencils/contact.pen` design file — encrypted, not a runtime surface
- Historical plan documents under `plans/26*` that quote the old placeholder
- Database-stored guide phone numbers (per-guide, not company-wide)

## Architectural Note (Follow-up Candidate)

`phoneValue` is duplicated between `messages/*.json` and `CONTACT_PHONE` constant. Footer reads constant, contact-info reads i18n message. Not solved by this plan — sync values now, consider DRY refactor later (route both through `CONTACT_PHONE`).

## Success Criteria

- `grep -r "70 123 45 67" apps packages` returns zero non-test, non-archived-plan hits
- Footer + contact page + cancellation page render `+46 72 441 19 01` in all three locales
- `tel:` links resolve to `+46724411901`
- Schema.org JSON-LD (`telephone` field) emits `+46724411901`
- WhatsApp floating button uses `46724411901` once CMS / env is set
