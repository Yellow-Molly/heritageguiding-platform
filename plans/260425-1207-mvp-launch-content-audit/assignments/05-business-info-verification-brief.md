# Brief 05 — Business Info Verification (Business Owner)

**Recipient:** Business owner / managing director
**Deadline:** TBD by project lead (BLOCKS phase-01 and phase-02)
**Format:** Sign-off doc at `plans/260425-1207-mvp-launch-content-audit/business-data-signoff.md`
**Submit to:** Project lead

---

## Context

Frontend, schema.org markup, and Payload SiteSettings all need verified canonical contact data. Today the codebase has mismatches (schema.org "Gamla Stan / 111 29" vs i18n "Drottninggatan 5 / 111 51") and unverified social URLs. We need a single signed source of truth before phase-01 and phase-02 can ship.

> **Decided:** Office address is **Karlavägen 18, 114 31 Stockholm** (validation 2026-04-25). Other fields below still need verification.

---

## Deliverables

A signed `business-data-signoff.md` with verified values for every field below.

## Fields to verify

| Field | Format | Test procedure |
|-------|--------|----------------|
| Email (primary) | e.g. `info@privatetours.se` | Send test message, confirm reply within 1 business day |
| Phone (primary) | e.g. `+46 70 123 45 67` | Call during stated hours, confirm answered or recorded |
| WhatsApp number | `46701234567` (no `+`, no spaces) | Send "test" via wa.me link; confirm receive + reply |
| Street address | `Karlavägen 18` (DECIDED) | Already canonical |
| Postal code + city | `114 31 Stockholm` (DECIDED) | Already canonical |
| Country code | `SE` | — |
| Office hours (per locale) | "Mån-Fre 08:00-18:00" / "Mon-Fri 08:00-18:00 CET" / "Mo-Fr 08:00-18:00" | Match staffed reality, not aspirational |
| Instagram URL | https://instagram.com/{handle} | Verify HTTP 200 + branded profile + post in last 90 days |
| Facebook URL | https://facebook.com/{handle} | Same |
| LinkedIn URL | https://linkedin.com/company/{handle} | Same |
| YouTube URL (optional) | https://youtube.com/@{handle} | Same, if applicable |

## Acceptance criteria

- [ ] Every field above has a verified value
- [ ] Email test passed (reply received)
- [ ] Phone test passed (call answered)
- [ ] WhatsApp test passed (message received + reply)
- [ ] All social URLs return HTTP 200 + active profile
- [ ] Office hours match staffed availability
- [ ] Owner signature + date in `business-data-signoff.md`

## How to submit

1. Project lead creates `business-data-signoff.md` template
2. Owner fills + signs
3. Owner notifies phase-01, phase-02, phase-05 leads

## Risks / notes

- Residential address has GDPR risk → use coworking/registered office if needed
- WhatsApp Business preferred over personal number
- Reserve all social handles before launch (impersonation risk)
- Email needs SPF/DKIM/DMARC (coordinate with IT)

## Questions / contact

- Sign-off template → project lead
- DNS/email setup → IT lead
