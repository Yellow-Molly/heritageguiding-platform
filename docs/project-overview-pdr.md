# Project Overview & Product Development Requirements (PDR)

**Document Version:** 1.0
**Last Updated:** January 13, 2026
**Status:** Phase 01 Complete - Ready for Phase 02
**Project Lead:** Technical Team

## Executive Summary

HeritageGuiding is an AI-first tourism booking platform consolidating the Stockholm heritage tourism market. The MVP combines advanced technology (Next.js 15, Payload CMS 3.0) with superior UX to capture market share from 50-100 fragmented competitors. Launch target: 12 weeks.

## Product Vision

**Mission:** Enable world-class heritage experiences in Stockholm through intelligent technology that serves both human visitors and AI agents.

**Unique Position:**
- AI-first architecture (structured data for AI discovery)
- Multilingual support (SV/EN/DE)
- WCAG 2.1 AA accessible from day one
- Professional booking infrastructure (Rezdy integration)
- Superior content quality over quantity

**Target Market:**
- Primary: International tourists seeking authentic heritage experiences
- Secondary: Tour guides/agencies seeking booking platform
- Tertiary: AI agents (ChatGPT, Perplexity, Google AI) discovering experiences

## Phase 01: Foundation Setup - COMPLETE ✅

### Phase 01 Objectives

| Objective | Status | Notes |
|-----------|--------|-------|
| Monorepo structure | ✅ | apps/web + packages/cms/ui/types |
| Next.js 15 setup | ✅ | App Router + TypeScript + ESLint + Prettier |
| Payload CMS 3.0 | ✅ | PostgreSQL + Lexical editor + Vercel Blob |
| Users collection | ✅ | Admin auth with role-based access |
| Media collection | ✅ | Image upload to Vercel Blob |
| CI/CD pipeline | ✅ | GitHub Actions (lint, type-check, build) |
| Dev environment | ✅ | Local dev ready, no errors |
| Documentation | ✅ | Architecture, standards, roadmap |

### Phase 01 Deliverables

**Repository Structure:**
```
heritageguiding-platform/
├── apps/web/              # Next.js 15 + Payload integration
├── packages/
│   ├── cms/              # Payload config + collections
│   ├── ui/               # Shared UI components (placeholder)
│   └── types/            # Shared TypeScript types
├── .github/workflows/    # CI/CD automation
├── docs/                 # Project documentation
└── plans/                # Phase plans & reports
```

**Technology Stack Confirmed:**
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- CMS: Payload 3.0, Lexical Editor, PostgreSQL 15+
- Storage: Vercel Blob for images
- DevOps: GitHub Actions, Vercel deployment
- Quality: ESLint 9, Prettier 3, TypeScript strict mode

**Development Environment:**
- Dev server runs without errors
- Payload admin accessible at `/admin`
- Database migrations working
- Package manager: npm with version 10+
- Node version: 20 (CI) with local >= 20

**CI/CD Pipeline:**
- Automated lint checking (ESLint 9)
- Type checking (TypeScript strict)
- Format validation (Prettier)
- Build testing (npm run build)
- Triggers: Push to main/staging/develop, PRs to main/staging

### Phase 01 Acceptance Criteria - ALL MET ✅

- ✅ Development server runs without errors
- ✅ Payload CMS admin accessible at `/admin`
- ✅ Database migrations working correctly
- ✅ Package structure organized and documented
- ✅ ESLint, Prettier, TypeScript configured
- ✅ CI/CD pipeline runs successfully
- ✅ Documentation complete (architecture, standards, codebase)

## Phase 02: i18n & Localization (NEXT)

### Phase 02 Objectives

| Objective | Estimate | Notes |
|-----------|----------|-------|
| next-intl setup | 8-10h | SV/EN/DE routing |
| Language switcher | 6-8h | Component + session persistence |
| Content localization | 6-8h | Per-field translations in Payload |
| Date/time formatting | 2-3h | Locale-specific formatting |
| SEO i18n | 2-3h | hreflang tags, sitemap |

**Time Estimate:** 24-28 hours

### Phase 02 Deliverables

1. **Language Routing** - Access via `/sv`, `/en`, `/de`
2. **Admin Localization** - Create/edit tours in 3 languages in Payload CMS
3. **Date/Time Formatting** - Locale-aware dates, times, currencies
4. **Language Persistence** - User preferences saved across sessions
5. **SEO Support** - hreflang tags for search engines

### Phase 02 Acceptance Criteria

- ✅ All routes accessible with language prefix
- ✅ Language preferences persist across sessions
- ✅ Content editable in all three languages via CMS
- ✅ Date/time formatting correct per locale
- ✅ hreflang tags generated automatically

## Phase 03: Data Models & CMS Schema

### Core Collections to Define

| Collection | Fields | Est. Hours |
|-----------|--------|-----------|
| **Tours** | title, description, price, duration, guide, category, media, accessibility, published | 8-10 |
| **Guides** | name, bio, credentials, photo, tours | 4-6 |
| **Categories** | name, slug, description, tours | 2-3 |
| **Reviews** | rating, text, date, tour, author | 3-4 |
| **Media** | (already exists) refine for tour-specific needs | 3-5 |

**Time Estimate:** 20-24 hours

## Core MVP Features

### Must-Have (Phase 01-13)

| Feature | Phase | Est. Hours |
|---------|-------|-----------|
| Multiple language support (SV/EN/DE) | 2 | 24-28 |
| Tour catalog with filters | 6 | 24-28 |
| Tour detail pages | 7 | 28-32 |
| Rezdy booking integration | 8 | 24-28 |
| Group inquiry form | 9 | 12-14 |
| WhatsApp integration | 10 | 8-10 |
| WCAG 2.1 AA accessibility | 11 | 16-20 |
| SEO & Schema.org markup | 13 | 14-16 |

### Nice-to-Have (Post-MVP)

- Advanced AI content generation
- Vector database semantic search
- Neighborhood-specific landing pages
- TripAdvisor integration
- French language support
- Partner portal for agencies
- Advanced analytics dashboard
- Blog/content marketing CMS
- Customer user accounts
- Mobile apps (iOS/Android)

## Success Metrics

### Technical Metrics

| Metric | Target | Verification |
|--------|--------|--------------|
| Lighthouse Performance | 90+ | PageSpeed Insights |
| Accessibility Score | WCAG 2.1 AA | aXe audit |
| Page Load Time | <2s on 3G | WebPageTest |
| Mobile Responsiveness | 100% | Responsive design testing |
| Browser Compatibility | Latest 3 versions | Cross-browser testing |
| Uptime | 99.9% | Monitoring tools |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Booking Conversion Rate | >3% | Google Analytics |
| Inquiry Form Submissions | >10/week | Form tracking |
| Language Distribution | SV 40%, EN 35%, DE 25% | Analytics |
| Mobile Traffic | >60% | Device breakdown |
| Return Visitor Rate | >25% | Analytics |

### Content Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Tours Available | 5-10 at launch | All languages |
| Expert Profiles | 4-6 guides | With credentials |
| Tour Images | 3+ per tour | High quality |
| Customer Reviews | 10-15 | Sample data at launch |

## Non-Functional Requirements

### Performance

- Page load time: <2 seconds on 3G networks
- Time to First Contentful Paint: <1 second
- Cumulative Layout Shift: <0.1
- First Input Delay: <100ms
- Database queries: <100ms avg response time

### Accessibility

- WCAG 2.1 Level AA compliance (not AAA)
- Keyboard navigation fully functional
- Screen reader support (ARIA labels)
- Color contrast ratio 4.5:1 minimum
- Focus indicators visible
- Skip-to-content links

### Security

- HTTPS enforced
- Environment secrets not in code
- SQL injection prevention (parameterized queries)
- XSS protection (React handles)
- CSRF tokens for state changes
- Rate limiting on API endpoints
- Authentication for admin routes

### Scalability

- Handle 1000 concurrent users
- Horizontal scaling via Vercel
- Database connection pooling
- CDN for image delivery
- Caching strategy for frequently accessed data

### Reliability

- Automated daily database backups
- Error tracking and alerting
- Zero-downtime deployments
- Graceful error handling
- 99.9% uptime SLA

## Technical Constraints

### Must Use

- Next.js 15 (no alternatives)
- Payload CMS 3.0 (no alternatives)
- PostgreSQL (no SQLite)
- TypeScript strict mode
- Tailwind CSS for styling
- Vercel for frontend hosting

### Must NOT Use

- Pages directory (use App Router only)
- Class components (use functional only)
- Custom CSS (use Tailwind)
- Hardcoded secrets
- Unsafe database queries
- console.log in production

## Dependencies & Risks

### External Dependencies

| Service | Critical? | Fallback |
|---------|-----------|----------|
| PostgreSQL hosting | Yes | Switch provider (1 day) |
| Vercel deployment | Yes | Switch to AWS (2 days) |
| Vercel Blob storage | No | Use Cloudinary (1 day) |
| Email service | Yes | Resend or SendGrid (1 day) |
| Rezdy API | Yes | Manual booking form (2 days) |

### Key Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Rezdy API delays | Booking feature blocked | Medium | Early integration testing |
| UX design unavailable | Use shadcn/ui defaults | Low | Acceptable for MVP |
| Content not ready | Use placeholder text | Medium | CMS allows easy updates |
| Database connection issues | App offline | Low | Connection pooling + retries |
| Scope creep | Timeline overruns | High | Strict MVP scope definition |

## Timeline & Milestones

### Development Phases (17 Total)

| Week | Phases | Focus | Deliverable |
|------|--------|-------|------------|
| **Week 1** | 01 | Foundation | Dev environment ready |
| **Week 1-2** | 02 | i18n | Multilingual routing |
| **Week 2** | 03 | Data models | CMS schema defined |
| **Week 3-5** | 04-08 | Core platform | Homepage, catalog, details, booking |
| **Week 6-8** | 09-13 | Advanced features | Groups, WhatsApp, SEO, accessibility |
| **Week 9-11** | 14-16 | Polish & test | Performance, QA, documentation |
| **Week 12** | 17 | Launch | Production deployment |

### Critical Milestones

1. **Week 1** - Foundation complete ✅
2. **Week 2** - i18n & data models complete
3. **Week 5** - Rezdy integration tested
4. **Week 8** - All features implemented
5. **Week 11** - Complete UAT cycle
6. **Week 12** - Go-live 🚀

## Definition of Done

The MVP is complete when **ALL** criteria are met:

### Code Quality
- ✅ No TypeScript errors (strict mode)
- ✅ ESLint passes with no warnings
- ✅ Prettier formatting applied
- ✅ All tests pass
- ✅ Code reviewed and approved

### Functionality
- ✅ All 17 phases implemented
- ✅ All user flows work end-to-end
- ✅ Booking system functional
- ✅ Admin CMS operational
- ✅ No critical bugs

### Performance & Quality
- ✅ Lighthouse 90+ across categories
- ✅ WCAG 2.1 AA compliance verified
- ✅ <2s load time on 3G
- ✅ Mobile responsive
- ✅ Cross-browser compatible

### Documentation
- ✅ CMS user guide completed
- ✅ Technical documentation updated
- ✅ Deployment procedures documented
- ✅ Code comments for complex logic

### Deployment
- ✅ Production database configured
- ✅ SSL certificate active
- ✅ Domain configured
- ✅ Vercel deployment successful
- ✅ Monitoring & alerts active

## Post-MVP Plan

### Stabilization Period (Phase 18)

**Duration:** 3 months post-launch
**Effort:** 40-50 hours

**Activities:**
- Monitor production errors
- Performance optimization
- Content refinements
- User feedback implementation
- Bug fixes

### Future Features (Phase 19+)

**Estimated:** 50-150 hours depending on priority

1. AI-powered content generation
2. Semantic search with vectors
3. Neighborhood-specific pages
4. TripAdvisor integration
5. Fourth language (French)
6. Agency partner portal
7. Advanced analytics
8. Blog/marketing content
9. Customer user accounts
10. Mobile applications

## Project Governance

### Decision Making

- **Tech Decisions:** Technical team decides
- **Feature Scope:** Product + Technical consensus
- **Design:** UX designer with team input
- **Deployment:** Technical team + stakeholder approval

### Communication

- **Weekly Syncs:** Every Monday, 60 minutes
- **Async Updates:** Email/Slack for blockers
- **Code Reviews:** Before merge to main
- **Deliverable Reviews:** 48-hour feedback window

### Quality Gates

- **Lint:** Must pass ESLint before commit
- **Types:** Must pass TypeScript before PR
- **Build:** Must pass production build before merge
- **Tests:** Must pass all tests before merge
- **Review:** Requires code review approval

## Resources & Team

### Required Roles

- **Technical Lead:** Architecture, oversight, decisions
- **Full-Stack Developer:** Implementation (4 phases)
- **UX Designer:** Design system, components
- **QA/Tester:** Testing, bug reporting
- **DevOps:** Infrastructure, CI/CD, monitoring

### Tools & Services

- **Version Control:** GitHub
- **Project Management:** (Issues in GitHub)
- **Communication:** Slack, email
- **Deployment:** Vercel
- **Database Hosting:** Supabase, Railway, or AWS RDS
- **Monitoring:** Sentry, Vercel Analytics

## Approval & Sign-Off

| Role | Approval | Date |
|------|----------|------|
| Product Owner | Pending | - |
| Technical Lead | Approved | Jan 13, 2026 |
| Stakeholder | Pending | - |

## Next Steps

1. **Review PDR** - Product owner review (48 hours)
2. **Confirm Scope** - Finalize must-have vs nice-to-have
3. **Setup Environment** - Vercel, database, email services
4. **Begin Phase 2** - i18n implementation (Week 2)
5. **Weekly Syncs** - Start recurring Monday meetings

---

**Document Status:** Ready for stakeholder review
**Questions?** Contact technical lead
**Last Review:** January 13, 2026
