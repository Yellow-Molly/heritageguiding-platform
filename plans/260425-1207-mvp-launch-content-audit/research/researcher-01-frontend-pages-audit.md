# Researcher 01: Frontend Pages Content Audit

**Date:** 2026-04-25
**Scope:** All public-facing pages (12 routes) and 50+ components in apps/web
**Focus:** Hardcoded text, placeholder/stub content, dummy data, contact info, unverified claims

---

## CRITICAL FINDINGS (Block MVP Launch)

### 1. Fake Customer Testimonials (Homepage)
- **File:** `apps/web/components/home/testimonials.tsx:19-56`
- **Issue:** 4 hardcoded testimonials w/ fake names (Sarah Mitchell, Marcus Weber, Emma Larsson, James Chen), Unsplash placeholder avatars, generic quotes
- **Action:** Replace w/ real testimonials OR hide section
- **Owner:** Content editor + Legal

### 2. Hardcoded Contact Information

**Footer (every page)** — `apps/web/components/layout/footer.tsx:64-120`
- Email: `info@privatetours.se` (l.114)
- Phone: `+46 8 123 456 78` (l.109)
- Address: `Gamla Stan, Stockholm, Sweden` (l.104)
- Hours: `Daily 9:00 - 18:00 CET` (l.120)
- Newsletter heading "Stay Updated" (l.64) — hardcoded EN
- Newsletter copy + input placeholder + button — hardcoded EN
- Action: Move to i18n. Verify contact details.

**Cancellation CTA** — `apps/web/app/(site)/[locale]/(frontend)/cancellation/page.tsx:95-96`
- Hardcoded `email="hello@privatetours.se"`, `phone="+46 8 123 456"` — STUB
- Action: Move to i18n/env

**Privacy page** — `apps/web/app/(site)/[locale]/(frontend)/privacy/page.tsx:125`
- Raw `<strong>Email:</strong> privacy@privatetours.se` in JSX prose
- Action: i18n key

### 3. TODO Comment — Reviews Disabled
- **File:** `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx:84`
- `{/* TODO: Unhide ReviewsSection when reviews are available */}`
- Action: Confirm reviews timeline OR document MVP exclusion

### 4. Address Inconsistency Across Components

**Schema.org (SEO)** — `apps/web/components/seo/travel-agency-schema.tsx:35-40`
- streetAddress: "Gamla Stan" (neighborhood, not street)
- postalCode: "111 29" (mismatches contact form 111 51)

**Contact Form** — `apps/web/components/contact/contact-info-section.tsx:73-82`
- Drottninggatan 5, 111 51 Stockholm (i18n-driven)

Action: Standardize across schema.org + i18n + footer

### 5. Fake Dates on Legal Pages
- `apps/web/app/(site)/[locale]/(frontend)/privacy/page.tsx:48` → `lastUpdated: 2026-01-01`
- `apps/web/app/(site)/[locale]/(frontend)/terms/page.tsx:48` → same
- Action: Update to real legal review dates
- Owner: Legal + Content editor

### 6. Fake Review Ratings in SEO Schema
- **File:** `apps/web/components/seo/travel-agency-schema.tsx:42-44`
- `ratingValue: 4.9`, `reviewCount: 735` — hardcoded, no backing data
- Action: Integrate real reviews OR remove from schema (avoid misleading Google)

### 7. Placeholder Blog Content
- **File:** `apps/web/components/home/latest-posts.tsx:18-44`
- Comment: "Placeholder blog data — CMS integration deferred"
- 3 hardcoded blog posts: "Hidden Courtyards of Gamla Stan...", "Winter Photography Tips for Stockholm", "The Art of Swedish Fika..."
- Heading "Latest From Our Blog" hardcoded EN
- Action: Either build blog CMS OR hide section for MVP

### 8. Unverified Marketing Claims (Trust Signals)
- **File:** `apps/web/components/home/trust-signals.tsx:83-108`
- "15+ years experience", "98% happy travelers", "100% trusted agency"
- Action: Confirm each stat is verifiable / defensible
- Owner: Content editor + Product

### 9. Hardcoded Social Media URLs
- `apps/web/components/contact/contact-info-section.tsx:18-21`
- `apps/web/components/seo/travel-agency-schema.tsx:46-49`
- instagram.com/privatetours, facebook.com/privatetours, linkedin.com/company/privatetours
- Action: Verify accounts exist
- Owner: Marketing

### 10. Hardcoded Tour Names in Footer
- **File:** `apps/web/components/layout/footer.tsx:9-15`
- "Gamla Stan Walking Tour", "Royal Palace Experience", "Vasa Museum Deep Dive"
- Action: Verify slugs match CMS OR fetch dynamically

---

## HIGH-PRIORITY (Should Fix Before MVP)

### 11. Newsletter Text Not Localized
- `apps/web/components/layout/footer.tsx:64-82` — heading/tagline/placeholder/button all hardcoded EN

### 12. Language Selector Names Hardcoded
- `apps/web/components/layout/footer.tsx:175-177` — `<option value="en">English</option>`

### 13. "View on Google Maps" Hardcoded
- `apps/web/components/contact/contact-info-section.tsx:82`

### 14. "Read More" Hardcoded
- `apps/web/components/home/latest-posts.tsx:89-90, 117-118`

### Footer Tagline Hardcoded
- `apps/web/components/layout/footer.tsx:95-97` — "Discover Stockholm's rich history with expert-led heritage tours..."

---

## PAGE-LEVEL SUMMARY

| Page | Risk | Issues |
|------|------|--------|
| `/` (home) | HIGH | Fake testimonials, placeholder blog, unverified trust stats |
| `/tours` | OK | Dynamic CMS, proper i18n |
| `/tours/[slug]` | MED | Reviews TODO comment |
| `/guides` | OK | Dynamic CMS |
| `/guides/[slug]` | OK | Dynamic CMS |
| `/find-tour` | OK | Wizard i18n-driven |
| `/about-us` | OK | All sections i18n |
| `/faq` | OK | i18n-driven |
| `/contact` | HIGH | Address mismatch, social URLs unverified |
| `/privacy` | HIGH | Fake date, hardcoded email |
| `/terms` | HIGH | Fake date |
| `/cancellation` | HIGH | Hardcoded email/phone stubs |

---

## COMPONENT TIER RANKING

### Tier 1 (Fix immediately)
1. `layout/footer.tsx` — 8+ hardcoded strings, on every page
2. `home/testimonials.tsx` — 4 fake testimonials
3. `seo/travel-agency-schema.tsx` — Fake ratings + address mismatch

### Tier 2 (High)
4. `home/latest-posts.tsx` — 3 placeholder blog posts
5. `contact/contact-info-section.tsx` — Address hardcoding/mismatch

### Tier 3 (Medium)
6. `home/trust-signals.tsx` — Unverified stats
7. Cancellation CTA — Stub email/phone

---

## OWNERSHIP MATRIX

| Owner | Task | Priority |
|---|---|---|
| Content Editor | Replace fake testimonials | CRITICAL |
| Content Editor | Standardize address (3 locales + footer + schema) | CRITICAL |
| Content Editor | Update legal dates (privacy/terms) | CRITICAL |
| Content Editor | Verify trust stats | HIGH |
| Marketing | Verify social handles + collect testimonials | CRITICAL |
| Frontend Dev | Move footer/newsletter text to i18n | HIGH |
| Frontend Dev | Hardcoded email/phone → i18n/env | HIGH |
| Legal | Set real privacy/terms effective dates | CRITICAL |
| Legal | Review schema.org accuracy | MEDIUM |
| Product | Confirm reviews timeline | HIGH |
| CMS Architect | Decide blog (build or hide) | HIGH |
| Backend Dev | Real review system OR remove from schema | MEDIUM |

---

## UNRESOLVED QUESTIONS

1. Real customer testimonials available, or hide section?
2. Actual office address? (Schema "Gamla Stan" vs. contact "Drottninggatan 5, 111 51")
3. Blog ready for MVP or hide?
4. Privacy/terms last reviewed when?
5. Trust stats source/verifiable?
6. Social handles real and active?
7. Reviews enabled before MVP?
8. Schema 4.9 rating + 735 reviews — real or sample?
9. Footer tour links: hardcode or fetch from CMS?

**Status:** DONE
