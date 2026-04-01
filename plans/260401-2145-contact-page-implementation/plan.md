# Contact Page Implementation Plan

**Created:** 2026-04-01
**Status:** Complete
**Branch:** `feat/contact-page`
**Design Source:** `pencils/General.pen` (frames: `oRzFd` Desktop, `PGCGI` Mobile)

## Overview

Implement the `/contact` page matching the Pencil design with Desktop (1440px) and Mobile (390px) layouts. Includes contact form with Zod validation, email notifications, optional CMS storage, i18n (SV/EN/DE), and trust strip.

## Design Summary

| Section | Desktop | Mobile |
|---------|---------|--------|
| **Hero** | Full-width bg image, dark overlay, centered heading + subtitle | Shorter (280px), smaller text (32px) |
| **Form + Info** | 2-column: form left + contact info right | Stacked: form then info |
| **Quick Links** | 3 cards in row (Book Tour, For Guides, FAQ) | Stacked cards with arrow |
| **Trust Strip** | 4 items horizontal with dividers | 2x2 grid |

### Key Design Tokens
- Primary: `#1E3A5F` (navy), Secondary: `#C4A052` (gold), Accent: `#E67E5A` (coral)
- Headings: Playfair Display, Body: Inter
- Card radius: 24px, Input radius: 9999px (pill), Message textarea: 16px
- Form shadow: `0 4px 24px rgba(0,0,0,0.05)`
- Background: `#FAFAF8`, Alt bg: `#F5F5F3`

### Form Fields
1. Full Name (text, required)
2. Email Address (email, required)
3. Phone Number (tel, optional)
4. Subject (select dropdown: General, Tour Booking, Group Inquiry, Partnership, Other)
5. Message (textarea, required)

### Contact Info
- Email: info@privatetours.se
- Phone: +46 70 123 45 67
- Address: Drottninggatan 5, 111 51 Stockholm
- Hours: Mon-Fri, 08:00-18:00 CET
- Social: Instagram, Facebook, LinkedIn

## Phases

| # | Phase | Status | Effort | Priority |
|---|-------|--------|--------|----------|
| 1 | [CMS Collection](./phase-01-cms-collection.md) | Complete | S | Medium |
| 2 | [i18n Translations](./phase-02-i18n-translations.md) | Complete | M | High |
| 3 | [API Route](./phase-03-api-route.md) | Complete | M | High |
| 4 | [Email Templates](./phase-04-email-templates.md) | Complete | S | High |
| 5 | [Contact Form Component](./phase-05-contact-form-component.md) | Complete | L | High |
| 6 | [Contact Page & Sections](./phase-06-contact-page-sections.md) | Complete | L | High |
| 7 | [Tests](./phase-07-tests.md) | Complete | M | High |

## Dependencies

- Phase 3 depends on Phase 1 (CMS collection slug)
- Phase 3 depends on Phase 4 (email templates)
- Phase 5 depends on Phase 2 (translation keys)
- Phase 6 depends on Phase 2, 5
- Phase 7 depends on all

## Cross-Plan Dependencies
- None detected (no overlapping unfinished plans)

## Architecture

```
apps/web/
  app/(site)/[locale]/(frontend)/contact/page.tsx    # Server page
  app/api/contact/route.ts                            # POST handler
  components/contact/
    contact-form.tsx                                   # Client form
    contact-info-section.tsx                           # Info + social + map
    contact-hero-section.tsx                           # Hero with bg image
    contact-quick-links.tsx                            # 3 CTA cards
    contact-trust-strip.tsx                            # 4 trust items
  lib/email/
    send-contact-notification-to-admin.ts             # Admin email
    send-contact-confirmation-to-customer.ts          # Customer email

packages/cms/
  collections/contact-inquiries.ts                    # CMS collection

apps/web/messages/
  en.json, sv.json, de.json                           # +contact namespace
```

## Success Criteria
- [x] Desktop and mobile match Pencil design
- [x] Form submits with validation errors shown inline
- [x] Honeypot spam protection
- [x] Rate limiting (5 req/min per IP)
- [x] Admin + customer email notifications (fire-and-forget, non-blocking)
- [x] Inquiry stored in CMS (local API only, REST blocked)
- [x] All 3 locales work (SV/EN/DE)
- [x] SEO metadata + ContactPage schema
- [x] Accessible (WCAG 2.1 AA)
- [x] Tests pass (29/29)

## Validation Summary

**Validated:** 2026-04-01
**Questions asked:** 4

### Confirmed Decisions
- **Persistence:** CMS + Email — store in ContactInquiries collection AND send email notifications
- **Contact data:** Hardcoded in i18n translations — business details rarely change, no API call needed
- **Map section:** Static image — Stockholm map screenshot, zero dependencies, matches design
- **Guide link:** "For Tour Guides" card links to `/contact` with `?subject=partnership` pre-selected in the form

### Action Items
- [x] Phase 5: Add URL query param support to pre-select subject dropdown (e.g. `?subject=partnership`)
- [x] Phase 6: Quick Links "For Tour Guides" card links to `/contact?subject=partnership`
- [x] Phase 6: Static map placeholder linking to Google Maps (GDPR-safe, no iframe)

## Cook Command
```bash
/ck:cook:auto plans/260401-2145-contact-page-implementation
```
