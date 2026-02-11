# HeritageGuiding Platform

Premium heritage tour booking platform for Sweden. AI-first architecture with advanced technology stack supporting Swedish/English/German markets.

**Status:** Phase 09 Complete - Group Bookings + WhatsApp Integration
**Live Demo:** Coming February 2026

## Quick Start

### Prerequisites
- Node.js 24+
- PostgreSQL 15+
- npm 10+

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/heritageguiding-platform.git
cd heritageguiding-platform

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev

# Visit http://localhost:3000
```

### Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server + Payload CMS |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run lint` | Check code quality |
| `npm run type-check` | Validate TypeScript |
| `npm run format` | Auto-format code |
| `npm test` | Run tests |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16.1.6, React 19.2.3, TypeScript 5.9.3, Tailwind CSS 4 |
| **CMS** | Payload CMS 3.75 with PostgreSQL |
| **i18n** | next-intl (SV/EN/DE routing + persistence) |
| **Styling** | Tailwind CSS + Radix UI 1.2.12 |
| **Testing** | Vitest 4.0.17 + React Testing Library |
| **Validation** | Zod 4.3.5 |
| **Import/Export** | ExcelJS 4.4.0 (CSV/Excel) |
| **Storage** | Vercel Blob (images), PostgreSQL (data) |
| **Hosting** | Vercel (frontend), PostgreSQL host (database) |
| **CI/CD** | GitHub Actions (lint, type-check, build) |

## Project Structure

```
heritageguiding-platform/
├── apps/web/                    # Next.js 16 frontend
│   ├── app/
│   │   ├── [locale]/           # Localized routes
│   │   ├── (payload)/          # Admin + API
│   │   ├── api/                # Route handlers
│   │   │   └── bokun/          # Bokun integration endpoints
│   │   └── ...
│   ├── components/             # 50+ React components
│   ├── lib/
│   │   └── bokun/              # Bokun API client + services
│   └── types/                  # TypeScript definitions
├── packages/
│   ├── cms/                    # Payload CMS config
│   │   ├── collections/        # 10 data models
│   │   └── fields/             # 7 reusable field modules
│   ├── ui/                     # Shared UI components
│   └── types/                  # Shared types
├── .github/workflows/          # CI/CD automation
├── docs/                       # Documentation
│   ├── project-overview-pdr.md # PDR & project vision
│   ├── codebase-summary.md     # Repository overview
│   ├── system-architecture.md  # Technical architecture
│   ├── code-standards.md       # Coding guidelines
│   ├── design-guidelines.md    # Design system
│   └── README.md               # Docs index
└── plans/                      # Development phases
```

## Key Features

### Phase 05: Homepage
- Hero section with parallax imagery
- Trust signals with statistics
- Featured tours grid
- Why Choose Us section
- Testimonials carousel
- Newsletter signup

### Phase 06: Tour Catalog
- Grid/list view toggle
- Category/price/duration filtering
- Full-text search
- Sort by rating, price, duration
- Pagination (12 tours/page)
- Mobile-responsive design
- Excel/CSV import-export for bulk operations

### Phase 07: Tour Detail
- Full-screen image gallery
- Tour facts and logistics
- Inclusions/exclusions lists
- Guide profile card
- Customer reviews with ratings
- Related tours recommendation
- Breadcrumb navigation
- JSON-LD schema markup

### Phase 08.5: Concierge Wizard
- 3-step personalized tour finder on /find-tour
- Step 1: Audience selection (family, couples, corporate, seniors, solo)
- Step 2: Interest selection (history, art, food/wine, photography, adventure, architecture)
- Step 3: Top 6 tour recommendations from Payload CMS
- localStorage persistence for returning visitors
- Full i18n (SV/EN/DE) and accessibility (WCAG 2.1 AA)
- 60 unit tests with 100% coverage

### Accessibility & i18n
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- 3 languages: Swedish, English, German
- Locale-specific formatting

## Environment Setup

### Required Variables
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/heritageguiding

# Payload CMS
PAYLOAD_SECRET=<32+ character random string>

# Frontend
NEXT_PUBLIC_URL=https://heritageguiding.com

# Bokun Integration (Phase 08.1)
BOKUN_ACCESS_KEY=<your-bokun-access-key>
BOKUN_SECRET_KEY=<your-bokun-secret-key>
BOKUN_ENVIRONMENT=test|production

# Optional: Image Storage
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>
```

### Admin Access
1. Start dev server: `npm run dev`
2. Visit: http://localhost:3000/admin
3. Create admin user or login with existing credentials
4. Manage tours, guides, reviews, pages

## Documentation

### Quick Start for New Team Members

1. **Understand the Project** - Read `project-overview-pdr.md` (15 min)
2. **Learn the Codebase** - Read `codebase-summary.md` (10 min)
3. **Know the Standards** - Read `code-standards.md` (15 min)
4. **Understand Architecture** - Read `system-architecture.md` (15 min)

**Total onboarding time: ~55 minutes**

### Documentation by Role

| Role | Primary Docs |
|------|-------------|
| **Product Manager** | project-overview-pdr.md, MVP-PROJECT-PLAN.md |
| **Developer** | code-standards.md, codebase-summary.md, system-architecture.md |
| **Tech Lead** | system-architecture.md, code-standards.md |
| **DevOps** | INFRASTRUCTURE-SETUP-COMPLETE.md, codebase-summary.md |
| **QA/Tester** | code-standards.md (testing), project-overview-pdr.md (metrics) |

### All Documentation Files

| File | Purpose |
|------|---------|
| [project-overview-pdr.md](./docs/project-overview-pdr.md) | Vision, roadmap, requirements, success metrics |
| [system-architecture.md](./docs/system-architecture.md) | Technical design, data models, API strategy |
| [code-standards.md](./docs/code-standards.md) | Coding guidelines, testing, commit standards |
| [codebase-summary.md](./docs/codebase-summary.md) | Repository structure, tech stack, CI/CD |
| [design-guidelines.md](./docs/design-guidelines.md) | Colors, typography, component patterns |
| [infrastructure-setup.md](./docs/infrastructure-setup.md) | Hosting, database, third-party services |
| [deployment-guide.md](./docs/deployment-guide.md) | CI/CD, environment variables, DNS |
| [MVP-PROJECT-PLAN.md](./docs/MVP-PROJECT-PLAN.md) | 17 phases, timeline, acceptance criteria |

## Development Workflow

### Before Starting Work
1. Read relevant docs in `./docs/`
2. Check existing code patterns
3. Create small, focused commits

### Pull Request Process
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following code standards
3. Run tests and lint: `npm run lint && npm test`
4. Commit with conventional messages: `feat(scope): description`
5. Push and create pull request
6. Address code review feedback

### Code Quality Gates
- All tests must pass
- No TypeScript errors
- ESLint must pass
- Code coverage 80%+
- No hardcoded secrets

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Check coverage
npm test -- --coverage
```

Tests verify:
- 50+ component tests
- 7 API function tests
- Edge cases and error handling
- i18n support across all locales

## Deployment

### Vercel (Frontend)
```bash
# Automatic on push to main
git push origin main
```

### Database Migrations
Payload CMS handles migrations automatically. No manual steps required.

### Environment Secrets
Set in Vercel dashboard or hosting provider:
- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `BLOB_READ_WRITE_TOKEN`

## Support

### Issues & Bugs
Report via GitHub Issues with:
- Reproduction steps
- Expected vs actual behavior
- Environment details

### Code Review
- All PRs require review before merge
- Address feedback promptly
- Ask questions if unclear

## Performance

**Metrics (Phase 07):**
- Lighthouse: 90+ (all categories)
- Page load: <2s on 3G
- Core Web Vitals: All green
- Mobile responsive: 100%

## Security

- No secrets in code
- Environment variables for sensitive data
- SQL injection prevention (Payload handles)
- XSS protection (React handles)
- CSRF tokens for state changes
- Input validation on all endpoints

## Team & Roles

- **Technical Lead**: Architecture, decisions
- **Full-Stack Developer**: Implementation
- **UX Designer**: Design system, components
- **QA/Tester**: Testing, bug reporting
- **DevOps**: Infrastructure, CI/CD

## Completed Phases

**Phase 08.1: Bokun Booking Integration + Excel Import/Export** (Feb 8, 2026)
- HMAC-SHA256 authentication with Bokun API
- Booking widget integration with fallback
- 60-second availability caching
- Webhook signature verification with HMAC
- Bookings collection for data persistence
- Semantic search with pgvector + OpenAI embeddings
- Rate limiting (400 req/min) with exponential backoff
- Excel/CSV import-export pipeline (Zod validation)

**Phase 08.5: Concierge Wizard** (Feb 10, 2026)
- 3-step wizard on /find-tour (replaces BubblaV AI chat)
- Audience selection: family, couples, corporate, seniors, solo
- Interest selection: history, art, food/wine, photography, adventure, architecture
- Personalized recommendations from Payload CMS API (top 6 matches)
- localStorage persistence for returning visitors
- Zod-validated POST /api/tours/recommend endpoint
- Full i18n (SV/EN/DE) and accessibility support
- 60 unit tests, 100% coverage

**Phase 09: Group Bookings + WhatsApp** (Feb 11, 2026)
- Group inquiry form with Zod validation (groups 20-200)
- POST /api/group-inquiry API route with rate limiting
- Email notifications: admin + customer confirmation (Nodemailer + Gmail SMTP)
- GroupInquiries Payload CMS collection + SiteSettings global
- WhatsApp floating button with wa.me deep links and localStorage dismiss
- GroupInquiryModal on tour detail booking section
- Standalone /group-booking page with full i18n (SV/EN/DE)
- Honeypot spam protection
- 39 unit tests (477 total tests passing)

## Next Phase (Phase 10)

**Accessibility & SEO** (Pending)
- WCAG 2.1 AA comprehensive audit
- Schema.org implementation for all content types
- Performance optimization
- Core Web Vitals validation

## License

Proprietary - All rights reserved

## Contact

- **Technical Lead**: [contact info]
- **Project Slack**: #heritageguiding
- **Docs Issues**: GitHub Issues

---

**Last Updated:** February 11, 2026
**Repository Version:** Phase 09 Complete
