# Phase 03 — Business Data Verification

## Context Links
- Research: [researcher-01-frontend-pages-audit.md](research/researcher-01-frontend-pages-audit.md) findings 2, 4, 9
- Research: [researcher-02-cms-i18n-content-audit.md](research/researcher-02-cms-i18n-content-audit.md) section 3, 7
- Blocks: phase-01 (frontend can't move data to constants until verified), phase-02 (whatsappNumber)

## Overview
- **Date:** 2026-04-25
- **Description:** Confirm every public business contact point is real, monitored, and consistent across the codebase.
- **Priority:** P1
- **Status:** pending
- **Review status:** not started

## Key Insights
- Email/phone/address embedded in i18n + hardcoded in 3+ component files; mismatches between schema.org and contact form
- Schema.org address ("Gamla Stan / 111 29") conflicts with i18n ("Drottninggatan 5, 111 51") — must pick canonical
- Social URLs (instagram.com/privatetours, facebook.com/privatetours, linkedin.com/company/privatetours) untested
- WhatsApp number empty in SiteSettings global

## Requirements

### Functional
- One canonical email, monitored 7 days/week with auto-reply during off-hours
- One canonical phone, staffed during published hours (Mån-Fre 08:00-18:00 CET)
- One canonical street address (one of: Drottninggatan 5 or Gamla Stan address)
- Social handles verified: each URL returns active business profile (HTTP 200, recent post)
- WhatsApp number formatted `46701234567` (no `+`, no spaces)
- Office hours match staffed reality (no aspirational hours)

### Non-functional
- Sign-off doc stored in `plans/260425-1207-mvp-launch-content-audit/business-data-signoff.md`
- All values traceable to a single source of truth (the sign-off)

## Architecture

```
Business owner ──► sign-off doc (canonical values)
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         phase-01    phase-02     phase-05
         (i18n+env)  (Globals)    (marketing)
```

- Single source: `business-data-signoff.md` lists every value w/ owner sign-off
- Downstream phases pull from this doc (no re-asking)

## Related Code Files (read-only this phase)

- `apps/web/messages/sv.json` — `contact.info.*` current values
- `apps/web/messages/en.json` — same
- `apps/web/messages/de.json` — same
- `apps/web/components/seo/travel-agency-schema.tsx:35-49` — schema address + social
- `apps/web/components/contact/contact-info-section.tsx:18-21,73-82` — social + address
- `apps/web/components/layout/footer.tsx:104-120` — footer contact
- `packages/cms/globals/SiteSettings.ts` — whatsappNumber field

## Implementation Steps

1. Business owner provides verified values for each item below; record in sign-off doc:
   - Email (e.g., `info@privatetours.se`)
   - Phone (e.g., `+46 70 123 45 67`)
   - WhatsApp (e.g., `46701234567`)
   - Street address line 1
   - Postal code + city
   - Office hours per locale (Mån-Fre / Mon-Fri / Mo-Fr)
   - Social URLs (Instagram, Facebook, LinkedIn) — confirmed live
2. Test email: send test message to verified address, confirm delivery + reply within 1 business day
3. Test phone: call during stated hours, confirm answered or recorded
4. Test WhatsApp: send "test" message to whatsappNumber via wa.me link
5. Visit each social URL: confirm active, branded profile w/ post in last 90 days
6. Resolve address discrepancy (schema.org "Gamla Stan / 111 29" vs i18n "Drottninggatan 5 / 111 51")
7. Document Sweden-specific format quirks (postal code "111 51" w/ space)
8. Sign-off doc gets owner signature/timestamp
9. Notify phase-01, phase-02, phase-05 leads that values are locked

## Todo
- [ ] Email verified (test sent, reply received)
- [ ] Phone verified (test call answered)
- [ ] WhatsApp number set + tested
- [ ] Office address resolved (canonical chosen)
- [ ] Postal code + city verified
- [ ] Office hours per locale finalized
- [ ] Instagram URL verified live + branded
- [ ] Facebook URL verified live + branded
- [ ] LinkedIn URL verified live + branded
- [ ] Sign-off doc created + signed
- [ ] Downstream phases notified

## Success Criteria
- `business-data-signoff.md` exists with every field + business owner signature/date
- All values pass live test (email reply, phone answered, social URLs HTTP 200)
- WhatsApp number formatted per Bokun/wa.me spec
- No phase-01/02/05 work blocked on contact data

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Owner unavailable to verify | Med | Critical | Schedule sign-off meeting before phase-01 starts |
| Social handles not yet claimed | Med | High | Marketing claims handles before launch; reserve all three |
| Phone hours don't match staffed reality | Med | High | Conservative published hours (less than staffed) |
| Address change post-launch | Low | High | Document update procedure (i18n + Globals + schema) |
| WhatsApp Business not enabled | Low | Med | Use personal WhatsApp w/ business catalog; upgrade post-MVP |

## Security Considerations
- Email: enable SPF/DKIM/DMARC to prevent spoofing
- Phone: published number is public — expect spam, route to IVR if volume high
- Address: GDPR — publishing a residential address is risky; use coworking/registered office
- Social URLs: verify HTTPS, check for impersonation accounts
- WhatsApp: business account preferred; personal number creates GDPR liability

## Next Steps
- Phase-01 unblocked: contact-constants module + i18n updates
- Phase-02 unblocked: SiteSettings.whatsappNumber
- Phase-05 unblocked: trust-signal claims tied to verified data
- Post-launch: quarterly contact data audit
