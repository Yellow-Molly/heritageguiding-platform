# MVP PROJECT PLAN
## HeritageGuiding Platform - AI-First Tourism Booking Platform

**Document Version:** 1.5
**Date:** February 10, 2026
**Status:** Phase 08.5 Complete - Concierge Wizard with audience-interest matching

---

## Executive Summary

This document outlines the MVP scope, timeline, and deliverables for the HeritageGuiding platform (formerly Sweden Tours). The MVP is a production-ready, AI-first booking platform designed to consolidate the fragmented tourism market.

### Project Overview

| Aspect | Details |
|--------|---------|
| **Total Development Time** | 310-372 hours (10-12 weeks) |
| **Target Launch** | 12 weeks from start date |
| **Technology Stack** | Next.js 16.1.6, Payload CMS 3.75, PostgreSQL, Bokun Integration, ExcelJS |
| **Languages Supported** | Swedish, English, German (French post-launch) |
| **Compliance** | WCAG 2.1 Level AA from day one |

### Strategic Positioning

The platform is designed with AI-first architecture, making it discoverable by AI agents (ChatGPT, Perplexity, Google AI) while providing exceptional user experience for human visitors.

---

## Core MVP Features

| Feature Category | Description |
|-----------------|-------------|
| **Multi-language Support** | Full Swedish, English, and German localization |
| **AI-First Architecture** | Schema.org structured data, hybrid content, scalable search |
| **Accessibility** | WCAG 2.1 Level AA compliant - keyboard nav, screen reader support |
| **Booking System** | Bokun integration for payments, calendar management |
| **Content Management** | Payload CMS 3.75 for tour management and multilingual workflows |
| **Bulk Operations** | Excel/CSV import-export for content management |
| **Group Bookings** | Inquiry form for groups 10+, WhatsApp integration |
| **Reviews & Trust** | Ratings display, expert credentials, certifications |
| **SEO & Discovery** | Meta optimization, OpenGraph, sitemap generation |
| **Static Pages** | FAQ and About Us with CMS-managed content |

---

## Development Phases & Timeline

The MVP development is organized into **17 distinct phases**.

### Phase 1-3: Foundation (Weeks 1-2)

| Phase | Hours | Key Deliverables |
|-------|-------|------------------|
| **1. Foundation** | 16-20 | Next.js 16.1.6, Payload CMS 3.75, PostgreSQL, Git structure |
| **2. i18n** | 24-28 | next-intl (SV/EN/DE), language switcher, hreflang tags |
| **3. Data Models** | 28-32 | Tours, Guides, Categories, Reviews, Media, Neighborhoods, Pages, Bookings collections |

### Phase 3: Data Models (Enhanced Schema)

**Core Collections:**
- **Tours:** title, description, pricing, duration, logistics (meeting point + coordinates), inclusions/exclusions, audience tags, accessibility, guide
- **Guides/Experts:** credentials, bio, photo, languages
- **Categories:** themes, neighborhoods
- **Reviews:** rating, text, date, tour reference
- **Media:** images with alt text, captions
- **Neighborhoods:** name, coordinates, city relationship
- **Pages:** Static pages (FAQ, About, Terms, Privacy)
- **Bookings:** Bokun webhook data, confirmation codes, status

**Tours Collection Key Fields:**
- Basic: title, slug, description, shortDescription, highlights
- Pricing: basePrice, currency, priceType, groupDiscount, childPrice
- Duration: hours, durationText
- Logistics: meetingPointName, coordinates (lat/long), googleMapsLink, parkingInfo
- Inclusions: included[], notIncluded[], whatToBring[]
- Audience: targetAudience (multi-select), difficultyLevel, ageRecommendation
- Accessibility: wheelchairAccessible, mobilityNotes, hearingAssistance
- Relationships: guide, categories, neighborhoods, images
- Booking: bokunExperienceId, availability, maxGroupSize
- SEO: metaTitle, metaDescription, featured, status

### Phase 4-8: Core Platform (Weeks 3-5)

| Phase | Hours | Key Deliverables |
|-------|-------|------------------|
| **4. Design System** | 32-36 | Tailwind config, shadcn/ui components, responsive design |
| **5. Homepage** | 28-32 | Hero, featured tours, Concierge Wizard, trust signals, footer |
| **5.5. Static Pages** | 6-10 | FAQ (accordion), About Us, Terms, Privacy |
| **6. Tour Catalog** | 24-28 | Grid/list views, filters, search, sorting, pagination |
| **7. Tour Details** | 32-36 | Gallery, expert bio, reviews, logistics map, inclusions, booking CTA |
| **8. Booking Integration** | 24-28 | Bokun API, availability sync, widget embedding ✅ |
| **8.1. Semantic Search** | 6-8 | pgvector + OpenAI embeddings, vector similarity ✅ |
| **8.1+. Excel Import/Export** | 4-6 | ExcelJS, format-agnostic pipeline, Zod validation ✅ |
| **8.5. Concierge Wizard** | 8-12 | 3-step wizard with audience-interest matching ✅ |

### Phase 9-13: Advanced Features (Weeks 6-8)

| Phase | Hours | Key Deliverables |
|-------|-------|------------------|
| **9. Group Bookings** | 12-14 | Inquiry form, email notifications, admin interface |
| **10. WhatsApp** | 8-10 | Floating button, click-to-chat, localized messages |
| **11. Accessibility** | 16-20 | WCAG 2.1 AA: keyboard nav, ARIA, focus management |
| **12. SEO Foundation** | 12-16 | Meta tags, OpenGraph, sitemap, robots.txt |
| **13. Schema.org** | 14-16 | TouristAttraction, Person, Organization, FAQPage |

### Phase 14-17: Polish & Launch (Weeks 9-12)

| Phase | Hours | Key Deliverables |
|-------|-------|------------------|
| **14. Performance** | 12-16 | Image optimization, code splitting, Core Web Vitals |
| **15. Testing** | 20-24 | Cross-browser, mobile, accessibility audit, QA |
| **16. Documentation** | 8-10 | CMS guide, technical docs, deployment procedures |
| **17. Deployment** | 8-12 | Production deploy, DNS, SSL, monitoring, launch |

---

## Technical Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16.1.6 (App Router), React 19.2.3, TypeScript 5.9.3, Tailwind CSS 4 |
| **CMS** | Payload CMS 3.75 with rich text, media management, RBAC |
| **Database** | PostgreSQL 15+ with full-text search, pgvector extension |
| **Booking** | Bokun API (HMAC-SHA256 auth, webhooks, 60s availability caching) |
| **Search** | pgvector semantic search with OpenAI embeddings (text-embedding-3-small, 1536 dims) |
| **Import/Export** | ExcelJS 4.4.0 (Excel/CSV pipelines, format-agnostic) |
| **Localization** | next-intl 4.7.0 for routing, date-fns for formatting |
| **Hosting** | Vercel (frontend), PostgreSQL (database) |
| **Media** | Vercel Blob for image optimization |
| **Email** | Resend for transactional emails |

### Site Structure

```
heritageguiding.com/
├── /                      # Homepage
├── /tours                 # Tour catalog
├── /tours/[slug]          # Tour details
├── /guides                # Guide profiles
├── /about-us              # About page
├── /faq                   # FAQ page
├── /terms                 # Terms & conditions
├── /privacy               # Privacy policy
├── /contact               # Contact page
└── /find-tour             # AI chatbot tour finder
```

---

## FAQ Page Structure

### Categories (20-28 questions minimum)

1. **Booking & Reservations** (5-6 questions)
   - How do I book? Can I book for groups? Changes to booking?

2. **Payment & Pricing** (4-5 questions)
   - Payment methods? Per person or group? Discounts? Refunds?

3. **Cancellation & Changes** (3-4 questions)
   - Cancellation policy? Reschedule? Weather cancellations?

4. **Tour Experience** (5-6 questions)
   - Duration? Languages? Accessibility? What to bring?

5. **About Our Guides** (3-4 questions)
   - Qualifications? Request specific guide? Tips?

---

## About Us Page Structure

### Sections
1. **Hero** - Headline, subtitle, team/location image
2. **Our Story** - 300-400 words: founding, mission, vision, values
3. **What Makes Us Different** - 4-6 differentiators (expertise, multilingual, accessibility)
4. **Team Profiles** - Photo, name, title, bio, credentials, specialization
5. **Certifications & Partnerships** - Licensed operator, UNESCO partner
6. **Contact CTA** - Questions? Contact form link

---

## MVP Acceptance Criteria

### Functional Requirements
- ✅ All pages display correctly in SV/EN/DE
- ✅ Browse tours by category, neighborhood, price, duration, accessibility
- ✅ Booking flow works end-to-end (date → payment → confirmation)
- ✅ Group inquiry form sends emails
- ✅ WhatsApp click-to-chat works
- ✅ CMS allows CRUD for tours, guides, reviews in all languages
- ✅ FAQ page with accordion UI in all languages
- ✅ About Us page with team section and mission

### Technical Requirements
- ✅ WCAG 2.1 Level AA compliance
- ✅ 90+ Lighthouse scores (Performance, Accessibility, SEO)
- ✅ Schema.org markup validates
- ✅ Mobile responsive (iOS Safari, Android Chrome)
- ✅ Cross-browser (Chrome, Firefox, Safari, Edge)
- ✅ SSL configured, HTTPS working

### Content Requirements
- ✅ Minimum 5 tours with complete content (all languages)
- ✅ Guide profiles with credentials and photos
- ✅ High-quality tour images (3+ per tour)
- ✅ Sample reviews for social proof
- ✅ FAQ with 20+ questions answered
- ✅ About Us with founder/team bios

---

## Project Timeline

| Week | Deliverable |
|------|-------------|
| **1-2** | Foundation: Dev environment, i18n, CMS, data models |
| **3-5** | Core platform: Homepage, catalog, details, booking, FAQ & About |
| **6-8** | Advanced: Group bookings, WhatsApp, accessibility, SEO, Schema |
| **9-11** | Polish: Performance, testing, content population |
| **12** | 🚀 **LAUNCH:** Production deployment, final QA |

### Post-Launch (Phase 18)
**Duration:** 3 months | **Hours:** 40-50
- Bug fixes, performance optimization, user feedback implementation, FAQ updates

---

## Time Estimates

| Version | Changes | Total Hours |
|---------|---------|-------------|
| v1.0 | Original MVP | 292-350 |
| v1.1 | +FAQ & About Us (+16h) | 302-364 |
| v1.2 | +Enhanced schema, Concierge Wizard (+20h) | 310-372 |
| v1.5 | Phase 08.5 Complete (Concierge Wizard) | 318-384 |

**Timeline:** Achievable in 12 weeks with proper planning.

---

## Schema Enhancement Summary (v1.2)

### Logistics / Meeting Point
- Meeting point name (localized), coordinates (lat/long)
- Google Maps link, meeting instructions, ending point
- Parking & public transport info

### Inclusions / Exclusions
- What's included, what's NOT included, what to bring
- All localized for SV/EN/DE

### Target Audience / Concierge Tags
- Multi-select: Family, Couples, Corporate, Seniors, History Nerds, Photography, Art, Food & Wine, Adventure, Architecture
- Powers Concierge Wizard and enhanced filtering

### Additional Fields
- Difficulty level (Easy/Moderate/Challenging)
- Age recommendations, enhanced accessibility, group size limits

---

## Risk Management

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Scope creep** | Timeline extends | Strict MVP scope; defer to post-launch |
| **Booking API issues** | Delayed functionality | Early testing; fallback to inquiry forms |
| **Design delays** | Extends design phase | Start with shadcn/ui defaults |
| **Content not ready** | Empty pages | Use placeholders; CMS allows updates |
| **Browser issues** | Unexpected bugs | Early testing from Week 9 |

---

## Success Metrics

### Technical
- Lighthouse: 90+ all categories
- WCAG 2.1 AA: 0 critical issues
- Uptime: 99.9% post-launch
- Page load: <2s on 3G

### User Experience
- Booking conversion rate
- Group inquiry submissions
- Language distribution (SV/EN/DE)
- FAQ page engagement

### SEO
- All pages indexed within 2 weeks
- Rich snippets in search results
- Core Web Vitals: All green

---

## Assumptions & Dependencies

### Assumptions
- Design assets by Week 3 (or shadcn/ui defaults)
- Tour content by Week 10 (or placeholders)
- Booking API access by Week 2
- Weekly sync meetings attended
- Feedback within 48 hours
- FAQ content drafted by Week 3 (10+ questions)
- About Us content & photos by Week 3

### External Dependencies
- Bokun API uptime
- Vercel platform stability
- PostgreSQL hosting
- Vercel Blob (images)
- Email service (Resend)

---

## Post-MVP Roadmap (Phase 19+)

Excluded from MVP, planned for post-launch:
- Advanced AI content generation
- Vector database search (300+ tours)
- GEO localization (neighborhood pages)
- TripAdvisor integration
- French language support
- Partner portal
- Blog/content marketing
- Customer accounts
- Mobile app
- Live chat support

**Estimated:** 50-150 hours depending on priority

---

## Next Steps

1. **Review & Approval** - Feedback within 48 hours
2. **Agreements** - Finalize legal
3. **Booking Setup** - Bokun account and API access
4. **Hosting** - Vercel, database, email service
5. **Kickoff** - Book first weekly sync
6. **Development** - Begin Phase 1

### Content Preparation
- [ ] FAQ questions (10+ by Week 3)
- [ ] About Us content (mission, story, values)
- [ ] Team photos and bios
- [ ] Terms & Privacy legal text
- [ ] Tour data in Excel template

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | Dec 28, 2025 | Original MVP plan |
| v1.1 | Jan 15, 2026 | Added FAQ & About Us pages |
| v1.2 | Jan 15, 2026 | Enhanced schema, Concierge Wizard |
| v1.3 | Feb 2, 2026 | Condensed document, updated to Bokun integration |
| v1.4 | Feb 8, 2026 | Phase 08.1 complete status |
| v1.5 | Feb 10, 2026 | Phase 08.5 Concierge Wizard complete |

---

*"Let's create something exceptional."*

**— Technical Team**
