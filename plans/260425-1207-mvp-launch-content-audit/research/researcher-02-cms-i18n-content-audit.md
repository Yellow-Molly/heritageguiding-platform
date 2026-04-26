# Researcher 02: CMS, i18n & Seed Data Audit

**Date:** 2026-04-25
**Scope:** i18n translation files, CMS collections, seed/sample data, static content
**Focus:** Find empty/placeholder/draft content + locale parity

---

## EXECUTIVE SUMMARY

- **i18n:** 579 keys per locale (SV/EN/DE) — 100% parity, no Lorem/TBD/TODO found
- **CMS Collections:** 13 schemas defined, NO seeded content — empty database
- **Seed Strategy:** Manual admin entry (no seed scripts)
- **Static legal copy:** Complete in i18n bundles (Terms, Privacy, Cancellation, FAQ)
- **Critical gap:** Tours, Guides, Reviews collections empty → MVP cannot launch w/o content

---

## 1. i18n TRANSLATION FILES (apps/web/messages/)

**Files:** sv.json, en.json, de.json — each 579 keys, identical structure

### Status: TRANSLATION-COMPLETE (no stubs found)
- Zero "TBD", "Coming soon", "Lorem ipsum", "TODO", "Placeholder"
- All 3 locales have parity

### Content Coverage in i18n Bundles
| Section | Keys | Status |
|---------|------|--------|
| `terms.*` | 30+ (7 sections) | Complete SV/EN/DE |
| `privacy.*` | 25+ (8 GDPR sections) | Complete SV/EN/DE |
| `cancellation.*` | 20+ | Complete SV/EN/DE |
| `faq.*` | 60+ (20 Q&A in 6 categories) | Complete SV/EN/DE |
| `contact.*` | 35+ | Complete SV/EN/DE |
| `about.*` | 50+ (story, mission, vision, 6 values, sustainability, certifications) | Complete SV/EN/DE |
| `home.*` | 40+ (hero, whyChooseUs, trust) | Complete SV/EN/DE |
| `notFound.*` | 15+ | Complete SV/EN/DE |
| `wizard.*` | (concierge wizard) | Complete SV/EN/DE |
| `tours.*` | (filters, sort, catalog) | Complete SV/EN/DE |

### Hardcoded Business Data Embedded in i18n
- `contact.info.emailValue` → `info@privatetours.se`
- `contact.info.phoneValue` → `+46 70 123 45 67`
- `contact.info.addressValue` → `Drottninggatan 5, 111 51 Stockholm`
- `contact.info.hoursValue` → `Mån-Fre 08:00-18:00 CET` (locale variants)
- `contact.trust.fiveStar*` → "5-Star Rated" / "Trusted by 2,000+ travelers" — ASPIRATIONAL claim, verify

---

## 2. CMS COLLECTIONS (packages/cms/collections/)

### Inventory (13 collections)

| Collection | Localized Fields | Status | MVP Critical | Seed Count Needed |
|-----------|------------------|--------|---|---|
| **Tours** | title, description, shortDescription, highlights, accessibility | Schema only — EMPTY | YES | 5+ |
| **Guides** | name (some), bio, credentials | Schema only — EMPTY | YES | 2+ |
| **Categories** | name, description | Schema only — EMPTY | YES | 6+ |
| **Cities** | name, description | Schema only — EMPTY | YES | 1 (Stockholm) |
| **Neighborhoods** | name, description | Schema only — EMPTY | Partial | 3+ |
| **Pages** | title, content, metaTitle, metaDescription | Schema only — EMPTY | YES | 6 (legal pages) |
| **Reviews** | text (localized), rating, author | Schema only — EMPTY | Partial | 10+ |
| **Media** | alt, caption (localized) | Schema only — EMPTY | YES | per image |
| **Bookings** | — (Bokun-synced) | Active | N/A | 0 |
| **Users** | — (auth) | Active | N/A | 1+ admin |
| **ContactInquiries** | — | Active store | Data only | 0 |
| **GroupInquiries** | — | Active store | Data only | 0 |
| **ExcelImports** | — | Active log | Data only | 0 |

### Field Requirements per Collection (MVP)

**Tours (per tour, per locale)**
- `title` — max 200 chars, SV/EN/DE required
- `description` — rich text 500-1500 chars/locale
- `shortDescription` — max 160 chars, used in card previews
- `highlights` — 1-10 bullets per locale
- `accessibility` group — wheelchair/hearing/visual + descriptions per locale
- Pricing, duration, logistics, audience tags — non-localized

**Guides (per guide)**
- `name` — single value
- `bio` — rich text 200-500 chars/locale (SV/EN/DE)
- `credentials` — array, each item localized
- `languages` — multi-select (SV/EN/DE/FR/ES/IT)
- `yearsExperience` — number (used in i18n template `{years}+ år`)
- Phase 16 fields: `guideStyle`, `whatGuestsAppreciate`, `uniqueAspectsQuote` (≤500 chars), `uniqueAspectsBody`, `specialtyDescriptions[]` (≤15)

**Pages (6 entries)** — alternative: keep headless from i18n
- `pageType` (about, faq, terms, privacy, contact, custom)
- `title`, `content` (rich text), `metaTitle`, `metaDescription` — all localized

**Categories**
- `name`, `description` localized SV/EN/DE
- e.g., "Historia & Kulturarv" / "History & Heritage"

**Media**
- `alt` REQUIRED localized (every tour image, guide photo, hero image)
- `caption` optional localized

### Schema Defaults (no placeholders)
- Tour status → "draft" (admin must publish)
- Tour featured → false
- Guide status → "active"
- Booking status → "pending" (Bokun webhook updates)
- Review verified → false (admin verifies)

---

## 3. CMS GLOBALS (SiteSettings)

- **whatsappNumber** — EMPTY, format needed: `46701234567` (no +)
- Owner: Business owner
- Action: Set before launch

---

## 4. SEED DATA STRATEGY

### Migration Files (1)
- `packages/cms/migrations/20260203-add-pgvector-extension.ts` — schema only, NO INSERTs

### Test Fixtures
- `e2e/fixtures/test-fixtures.ts` — E2E only, sample URLs `https://example.com/img1.jpg`

### No Production Seed Scripts
**Implication:** Database starts empty. All content seeded via:
- Manual admin entry through Payload UI
- CSV import (Tours collection has CSV import toolbar)

---

## 5. STATIC PAGE CONTENT — DECISION POINT

### Pages collection is empty BUT i18n bundles have all copy

| Page | i18n Source | CMS Status |
|------|-------------|-----------|
| FAQ | `faq.*` (60+ keys) | Empty |
| Terms | `terms.*` (30+ keys) | Empty |
| Privacy | `privacy.*` (25+ keys) | Empty |
| Cancellation | `cancellation.*` (20+ keys) | Empty |
| Contact | `contact.*` (35+ keys) | Empty |
| About | `about.*` (50+ keys) | Empty |
| 404 | `notFound.*` (15+ keys) | Empty |

### Strategy Options
- **Option A (Headless from i18n):** Pages render from JSON. No CMS edit. Devs update via PR.
- **Option B (CMS-managed):** Import i18n → Pages collection. Editorial UI control. Translations dual-tracked.

**Recommendation:** A for MVP (faster), B post-launch (editorial workflow)

---

## 6. CONTENT OWNERSHIP MATRIX

| Content | Field(s) | Locales | Status | MVP Owner |
|---------|---------|---------|--------|-----------|
| Tours | title, description, highlights, accessibility | SV/EN/DE | Empty | Tour copywriter |
| Tours | pricing, duration, logistics | — | Schema | Tour Manager |
| Guides | name, bio, credentials, profile sections | SV/EN/DE | Empty | Guide onboarding |
| Categories | name, description | SV/EN/DE | Empty | Category Manager |
| Pages (6) | title, content, meta | SV/EN/DE | i18n complete | Legal/Comms |
| Contact info | email/phone/address/hours | SV/EN/DE | i18n set, VERIFY | Business owner |
| Reviews | text, rating, author | SV/EN/DE | Empty | Moderation |
| SiteSettings.whatsapp | number | — | EMPTY | Business owner |
| Media | alt text per image | SV/EN/DE | Empty | Photo manager |

---

## 7. BLOCKING vs NON-BLOCKING

### Blocking MVP Launch
1. **Tour content** — 5+ tours seeded (CMS empty) — BLOCKER
2. **Guide content** — 2+ guides onboarded — BLOCKER
3. **Categories** — 6+ entries — BLOCKER
4. **Contact info verified** — email/phone/address/hours active
5. **SiteSettings.whatsappNumber** — set
6. **Media library** — tour/guide images uploaded with alt text

### Non-Blocking (Post-Launch)
- Pages CMS strategy (A vs B decision)
- i18n update workflow doc
- Reviews seeding (10+) — degrades UX but not blocking

---

## 8. PRIORITY CHECKLIST

### P1 — Block Launch
- [ ] Verify business contact data live (email, phone, address)
- [ ] Seed 5+ tours w/ real SV/EN/DE descriptions + media + pricing
- [ ] Seed 2+ guides w/ full bios + credentials + photos
- [ ] Seed 6+ categories
- [ ] Seed 1+ city (Stockholm) + 3+ neighborhoods
- [ ] Set SiteSettings.whatsappNumber
- [ ] Upload media w/ multilingual alt text
- [ ] Verify trust claim "Trusted by 2,000+ travelers" or rewrite

### P2 — Launch +1 week
- [ ] Decide Pages strategy (headless A vs CMS B)
- [ ] Seed 10+ reviews
- [ ] Document content update workflow

### P3 — Ongoing
- [ ] Quarterly legal review cycle
- [ ] Translation QA process
- [ ] Locale analytics

---

## UNRESOLVED QUESTIONS

1. Tour content delivery date? (Currently zero in CMS)
2. Guides onboarding date?
3. Email `info@privatetours.se` actually monitored?
4. Phone `+46 70 123 45 67` staffed during stated hours?
5. Office at Drottninggatan 5 confirmed?
6. WhatsApp number to use?
7. Pages strategy: A (headless) or B (CMS-managed)?
8. Trust claim "2,000+ travelers" verifiable or marketing aspiration?
9. Reviews can launch with 0 reviews (hide section) or need 10+ seeded?

**Status:** DONE
