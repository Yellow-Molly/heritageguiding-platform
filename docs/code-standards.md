# Code Standards & Best Practices

**Last Updated:** February 8, 2026
**Project:** HeritageGuiding Platform
**Phase:** 08.1 Complete - Bokun + Excel Import/Export
**Applies To:** All code in apps/, packages/, and scripts/
**Recent Update:** Bokun API integration, availability caching, semantic search, Excel/CSV import-export, ESLint 9 flat config, Node.js 24

## Core Principles

- **YAGNI** - You Aren't Gonna Need It
- **KISS** - Keep It Simple, Stupid
- **DRY** - Don't Repeat Yourself
- **Function over Form** - Readability matters more than formatting perfection

## TypeScript Standards

### Strict Mode
```json
// tsconfig.json
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true,
"strictFunctionTypes": true
```

### File Organization
```
apps/web/
├── app/
│   ├── (frontend)/        # Public routes
│   ├── (payload)/         # Admin + API routes
│   └── api/               # Route handlers
├── components/            # React components
├── lib/                   # Utilities & helpers
├── types/                 # TypeScript definitions
└── public/                # Static assets
```

### Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| **Files** | kebab-case | `user-profile.tsx`, `api-client.ts` |
| **Variables** | camelCase | `userId`, `isLoading` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| **Classes** | PascalCase | `UserRepository`, `ErrorHandler` |
| **React Components** | PascalCase | `HomePage`, `UserCard` |
| **Interfaces** | PascalCase | `IUser`, `IApiResponse` |

## React & Next.js Standards

### Component Structure
```typescript
// apps/web/components/sample-component.tsx
import type { ReactNode } from 'react'

interface SampleComponentProps {
  title: string
  children?: ReactNode
}

export function SampleComponent({
  title,
  children,
}: SampleComponentProps) {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}
```

### Rules
- Use functional components only
- No default exports for components
- Use named exports: `export function ComponentName() {...}`
- Prop interfaces always end in `Props`
- Always include prop type definitions
- Use destructuring in function params

### Next.js Specific
- Use **App Router** only (no pages/ directory)
- Route groups with `(name)` for organization
- Server components by default
- Use `'use client'` directive only when needed
- Prefer `next/link` over `<a>` tags
- Use dynamic imports with `React.lazy()` for code splitting

## File Organization - Phase 08.1 Complete

### Bokun Integration Structure (Verified)
```
apps/web/
├── lib/bokun/
│   ├── bokun-types.ts                          # Type definitions
│   ├── bokun-api-client-with-hmac-authentication.ts  # HMAC-SHA256 auth
│   ├── bokun-availability-service-with-caching.ts    # 60s TTL caching
│   ├── bokun-booking-service-and-widget-url-generator.ts  # URL generation
│   └── index.ts                                # Exports
├── app/api/bokun/
│   ├── availability/route.ts                   # GET availability
│   └── webhook/route.ts                        # POST webhook verification
└── components/
    └── bokun-booking-widget-with-fallback.tsx  # Widget with fallback
```

### Semantic Search Structure (Phase 08.1+)
```
apps/web/
├── lib/ai/
│   ├── openai-embeddings-service.ts            # text-embedding-3-small
│   └── pgvector-semantic-search-service.ts     # Vector similarity
└── app/api/search/
    └── semantic/route.ts                       # POST semantic search
```

## File Size Management

### Code Files
- **Target:** < 200 lines of code
- **When to split:**
  - Logic extraction: Create separate utility modules
  - Large components: Extract sub-components
  - Utility functions: Group related functions into dedicated files

### Document Files
- **Target:** < 800 lines of documentation
- **When to split:**
  - Create topic directories: `docs/{topic}/`
  - Use index.md for overview + navigation
  - Separate guides, references, and tutorials

## Error Handling

### Try-Catch Patterns
```typescript
try {
  // Operation
} catch (error) {
  if (error instanceof CustomError) {
    // Handle known error
  } else if (error instanceof Error) {
    console.error('Unexpected error:', error.message)
  } else {
    console.error('Unknown error:', error)
  }
  // Never silently fail
}
```

### API Route Errors
```typescript
// apps/web/app/api/route.ts
try {
  // API logic
  return Response.json({ data }, { status: 200 })
} catch (error) {
  return Response.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

## Testing Strategy

### Unit Tests
- **Files:** One test file per module: `{module}.test.ts`
- **Components:** `{component}.test.tsx` for React components
- **APIs:** `{function-name}.test.ts` for data-fetching functions
- **Vitest Jest Compatibility:** vi.fn() = jest.fn() (jest-compatible API)
- Test behavior, not implementation
- Use descriptive test names
- Minimum coverage: 80%
- Use Vitest 4.0.17+ for unit testing
- Current tests: 227+ covering components, APIs, utilities, import/export

### Integration Tests
- Test across module boundaries
- Use real database (test environment)
- Clean up fixtures after tests

### Testing Data-Fetching Functions
```typescript
describe('fetchTourById', () => {
  it('should return tour with full details when given valid ID', async () => {
    const tour = await fetchTourById('tour-123')
    expect(tour).toHaveProperty('title')
    expect(tour).toHaveProperty('logistics')
    expect(tour).toHaveProperty('guide')
  })

  it('should throw error when tour not found', async () => {
    await expect(fetchTourById('invalid-id')).rejects.toThrow()
  })

  it('should return localized content based on locale param', async () => {
    const tourSv = await fetchTourById('tour-123', 'sv')
    const tourEn = await fetchTourById('tour-123', 'en')
    expect(tourSv.title).not.toEqual(tourEn.title)
  })
})
```

### Testing Components
```typescript
describe('TourCard', () => {
  it('should render tour image, title, and price', () => {
    const { getByText } = render(
      <TourCard tour={mockTour} locale="en" />
    )
    expect(getByText(mockTour.title)).toBeInTheDocument()
    expect(getByText(`$${mockTour.price}`)).toBeInTheDocument()
  })

  it('should link to tour detail page', () => {
    const { getByRole } = render(
      <TourCard tour={mockTour} locale="en" />
    )
    const link = getByRole('link')
    expect(link).toHaveAttribute('href', `/en/tours/${mockTour.slug}`)
  })
})

### Testing Filter Components
```typescript
describe('CategoryChips', () => {
  it('should render all categories as clickable chips', () => {
    const { getByText } = render(
      <CategoryChips
        categories={mockCategories}
        selectedCategories={[]}
        onCategoryChange={jest.fn()}
      />
    )
    mockCategories.forEach(cat => {
      expect(getByText(cat.name)).toBeInTheDocument()
    })
  })

  it('should call onCategoryChange when chip clicked', () => {
    const onChange = jest.fn()
    const { getByText } = render(
      <CategoryChips
        categories={mockCategories}
        selectedCategories={[]}
        onCategoryChange={onChange}
      />
    )
    fireEvent.click(getByText(mockCategories[0].name))
    expect(onChange).toHaveBeenCalledWith([mockCategories[0].id])
  })
})

describe('DatesPicker', () => {
  it('should disable past dates', () => {
    const { container } = render(
      <DatesPicker
        startDate={undefined}
        endDate={undefined}
        onDateRangeChange={jest.fn()}
      />
    )
    // Verify disabled class on past day buttons
  })

  it('should call onDateRangeChange when dates selected', () => {
    const onChange = jest.fn()
    render(
      <DatesPicker
        startDate={undefined}
        endDate={undefined}
        onDateRangeChange={onChange}
      />
    )
    // Select date range in picker
    expect(onChange).toHaveBeenCalled()
  })
})
```

## Code Quality Tools

### ESLint
**File:** `apps/web/eslint.config.mjs`
**Version:** ESLint 9 with native flat config array (no FlatCompat needed)
**Config:** eslint-config-next 16.1.6 exports native flat config arrays

```bash
npm run lint         # Check code (no --ext flag needed)
npm run lint:fix     # Auto-fix issues
```

**ESLint 9 Flat Config Notes:**
- ❌ Old: `eslint . --ext .ts,.tsx` (ESLint 8 flag removed)
- ✅ New: `eslint .` (ESLint 9 auto-detects by file type)
- ✅ Config: Array format directly from eslint-config-next 16 (no FlatCompat needed)
- ✅ Extensions: Auto-detected, no manual specification needed

**Rules:**
- No unused imports
- No console.log in production
- No implicit any
- Consistent naming

### Prettier
**File:** `apps/web/.prettierrc`

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

```bash
npm run format         # Format code
npm run format:check   # Check formatting
```

### TypeScript
```bash
npm run type-check    # Validate types
```

**strict mode enabled** - Always use strict types, no `any` without justification.

## Commit Standards

### Format
Use conventional commits:
```
<type>(<scope>): <subject>

<body>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples:**
```
feat(auth): implement user authentication
fix(homepage): resolve layout issue on mobile
docs: update deployment guide
refactor(api): extract common response handler
```

### Pre-commit Checklist
- [ ] Code passes linting: `npm run lint`
- [ ] Types are valid: `npm run type-check`
- [ ] Code is formatted: `npm run format`
- [ ] No console logs left
- [ ] No commented-out code
- [ ] Commit message follows convention

### No Sensitive Data
**NEVER commit:**
- `.env` files with secrets
- API keys or credentials
- Database passwords
- Private configuration

## Payload CMS Standards

### Collection Structure
```typescript
// packages/cms/collections/example.ts
import type { CollectionConfig } from 'payload'

export const Example: CollectionConfig = {
  slug: 'example',
  admin: {
    useAsTitle: 'name', // Field for list display
  },
  fields: [
    // Field definitions
  ],
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
}
```

### Important TypeScript Notes
- **Payload 3.75 Breaking Change:** `ServerFunctionClient` type changed
  - Old: `args: unknown[]`
  - New: `args: Record<string, unknown>`
  - Update all server function clients when upgrading

### Field Naming
- Use camelCase for field names
- Be descriptive: `publishedAt` not `pub`
- Collections plural in exports, singular in slug

### Type Checking
- **Separate Type Checking for CMS:** `typescript.ignoreBuildErrors: true` is set in next.config.ts
- Reason: packages/cms has separate TypeScript compilation
- Run `npm run type-check` to verify overall types

### Localization Patterns
- Use `localized: true` for user-editable content
- All tours, guides, pages must support SV/EN/DE
- Default locale: Swedish (sv)
- Fallback chain: sv → en → de

### Access Control
- Define role-based access explicitly
- Never default to `true` for sensitive operations
- Document access rules in code comments

### Collection Field Groups
Use field modules for reusability:
- `seo-fields.ts` - Meta, OG tags (all collections)
- `logistics-fields.ts` - Meeting point, map, coords (tours)
- `tour-pricing-fields.ts` - Price, currency, discounts (tours)
- `tour-inclusion-fields.ts` - Inclusions/exclusions (tours)
- `accessibility-fields.ts` - WCAG compliance (tours, guides)
- `slug-field.ts` - Auto-formatted URL slugs (tours, guides)

## Styling with Tailwind

### File Structure
- Use Tailwind utilities directly in JSX
- Avoid custom CSS unless necessary
- Group related styles logically

```typescript
// Good
<div className="flex items-center justify-between gap-4 rounded-lg bg-slate-100 p-4">

// Avoid custom CSS for simple layouts
```

### Best Practices
- Use design tokens for colors/spacing
- Organize class names: layout → spacing → colors → effects
- Use responsive prefixes: `md:`, `lg:`, etc.

## Filter Component Patterns (Phase 07)

### FilterBar Architecture
FilterBar is a GetYourGuide-style sticky filter container with:
- Category chips (multi-select with URL state persistence)
- Mobile drawer synced with desktop chips
- Date range picker (react-day-picker v9)
- Results count display with pluralization

**Location:** `apps/web/components/tour/filter-bar/`

**Categories (Phase 07):** history, architecture, nature, maritime, royal

### Sub-Components

**CategoryChips:**
- Horizontal scrollable multi-select chips
- URL state: `?categories=history,architecture` (comma-separated)
- Clear all functionality
- Accessibility: ARIA labels, keyboard navigation
- Mobile: synchronized with filter drawer drawer

**FilterDrawer (Mobile):**
- Accessible drawer for category selection on small screens
- Syncs with desktop CategoryChips via URL params
- Touch-friendly button sizing

**DatesPicker:**
- Radix UI Popover trigger with Popover component
- react-day-picker for date selection
- Range validation & clear button
- Disabled past dates

**ResultsCount:**
- Displays pluralized count: "1 tour" vs "5 tours"
- i18n support with translation keys
- Updates reactively from parent state

### Integration Pattern
```typescript
// In tour-catalog-client.tsx (use client)
const [selectedCategories, setSelectedCategories] = useState<string[]>([])
const [startDate, setStartDate] = useState<Date | undefined>()
const [endDate, setEndDate] = useState<Date | undefined>()

return (
  <>
    <FilterBar
      categories={categories}
      selectedCategories={selectedCategories}
      onCategoryChange={setSelectedCategories}
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={(start, end) => {
        setStartDate(start)
        setEndDate(end)
      }}
      resultsCount={filteredTours.length}
    />
    {/* Render filtered tours */}
  </>
)
```

## Development Workflow

### Before Starting Work
1. Read relevant docs in `./docs/`
2. Check existing code patterns
3. Create small, focused commits

### During Development
1. Run tests frequently
2. Keep commits small and focused
3. Use meaningful commit messages
4. Ask for code review on major changes

### Before Submitting Code
```bash
npm run lint:fix       # Auto-fix style issues
npm run type-check     # Verify types
npm run format         # Format code
npm test               # Run tests (when available)
git push               # Push to remote
```

## Documentation Standards

### Code Comments
Use sparingly - code should be self-documenting.
```typescript
// Good: Explains WHY
// Rate limiting to prevent abuse
const MAX_REQUESTS_PER_MINUTE = 60

// Bad: Explains WHAT (code already shows this)
// Set max requests to 60
const MAX_REQUESTS_PER_MINUTE = 60
```

### Function Documentation
```typescript
/**
 * Fetches user by ID from database.
 *
 * @param id - User ID to fetch
 * @returns User object or null if not found
 * @throws DatabaseError if connection fails
 */
async function getUserById(id: string): Promise<User | null> {
  // Implementation
}
```

## Security Checklist

- [ ] No hardcoded secrets in code
- [ ] Environment variables for sensitive data
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS protection (React handles automatically)
- [ ] CSRF tokens for state-changing operations
- [ ] Input validation on all endpoints
- [ ] Rate limiting on API endpoints
- [ ] Auth checks on protected routes
- [ ] **Bokun-Specific (Phase 08.1):**
  - [ ] HMAC-SHA256 signature generation for requests
  - [ ] HMAC signature verification for webhooks
  - [ ] API secret protection (env vars only)
  - [ ] Webhook payload validation before processing

## Performance Best Practices

### Images
- Use `next/image` component
- Provide `alt` text
- Optimize image sizes
- Use WebP format when possible

### Code Splitting
- Use dynamic imports for large components
- Lazy load below-the-fold content
- Monitor bundle size

### Database
- Use indexes for frequently queried fields
- Avoid N+1 queries
- Cache frequently accessed data

## API Data-Fetching Standards

### Function Patterns
```typescript
// apps/web/lib/api/tours.ts
import type { Tour, TourDetail } from '@/types'

export async function fetchTours(
  locale: string,
  filters?: { category?: string; priceMax?: number }
): Promise<Tour[]> {
  try {
    // Query Payload GraphQL
    const response = await fetch(`${API_URL}/api/graphql`, {
      method: 'POST',
      body: JSON.stringify({ query, variables: { locale } }),
    })
    if (!response.ok) throw new Error('Failed to fetch tours')
    return response.json().data.tours
  } catch (error) {
    console.error('Tour fetch error:', error)
    throw new Error('Unable to load tours')
  }
}

export async function fetchTourById(
  slug: string,
  locale: string
): Promise<TourDetail> {
  // Ensure full typing + null checking
  const tour = await fetch(`/api/tours/${slug}?locale=${locale}`)
  if (!tour) throw new Error('Tour not found')
  return tour as TourDetail
}
```

### Bokun API Integration Pattern (Phase 08.1)
```typescript
// apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts
import crypto from 'crypto'

interface BokunConfig {
  accessKey: string
  secretKey: string
  environment: 'test' | 'production'
}

export class BokunAPIClient {
  private config: BokunConfig

  constructor(config: BokunConfig) {
    this.config = config
  }

  // Generate HMAC-SHA256 signature for requests
  private generateSignature(body: string): string {
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(body)
      .digest('hex')
  }

  // Verify webhook signature
  static verifyWebhookSignature(
    body: string,
    signature: string,
    secretKey: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(body)
      .digest('hex')
    return signature === expectedSignature
  }

  async getAvailability(experienceId: string, date: string) {
    const body = JSON.stringify({ experienceId, date })
    const signature = this.generateSignature(body)
    const response = await fetch(`${this.getBaseUrl()}/availability`, {
      method: 'POST',
      headers: {
        'X-Bokun-Access-Key': this.config.accessKey,
        'X-Bokun-Signature': signature,
        'Content-Type': 'application/json',
      },
      body,
    })
    return response.json()
  }

  private getBaseUrl(): string {
    return this.config.environment === 'test'
      ? 'https://api-test.bokun.io/v2'
      : 'https://api.bokun.io/v2'
  }
}
```

### Error Handling
- Always throw descriptive errors
- Log errors server-side only (not client)
- Return user-friendly error messages
- Never expose database/API internals

### Type Safety
- All functions must have return type annotations
- Use `Promise<T>` for async functions
- Export types from `/types` directory
- Validate responses against TypeScript types

## Review Checklist

**For Code Reviews:**
- [ ] Code follows standards
- [ ] Types are correct (no `any`)
- [ ] Error handling with try-catch
- [ ] Tests added/updated (80%+ coverage)
- [ ] No console logs in production
- [ ] No hardcoded secrets
- [ ] Security: input validation, CSRF tokens
- [ ] Performance: no N+1 queries, appropriate caching
- [ ] Documentation updated
- [ ] i18n support verified (all locales tested)
- [ ] **Bokun-Specific Checks (Phase 08.1):**
  - [ ] HMAC signatures correctly generated and verified
  - [ ] Webhook payload structure validated
  - [ ] Availability cache respects 60s TTL
  - [ ] Rate limiting with exponential backoff implemented
  - [ ] Environment variables for API keys used
  - [ ] Bookings collection updated on webhook events

## Questions or Clarifications?

Refer to:
- `./MVP-PROJECT-PLAN.md` - Project scope and timeline
- `./system-architecture.md` - System design
- `./codebase-summary.md` - Repository structure
