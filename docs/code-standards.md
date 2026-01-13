# Code Standards & Best Practices

**Last Updated:** January 13, 2026
**Project:** HeritageGuiding Platform
**Applies To:** All code in apps/, packages/, and scripts/

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
- One test file per module: `module.test.ts`
- Test behavior, not implementation
- Use descriptive test names
- Minimum coverage: 80%

### Integration Tests
- Test across module boundaries
- Use real database (test environment)
- Clean up fixtures after tests

### Naming Convention
```typescript
describe('UserRepository', () => {
  it('should create a new user with valid data', () => {
    // Test
  })

  it('should throw error when email is invalid', () => {
    // Test
  })
})
```

## Code Quality Tools

### ESLint
**File:** `apps/web/eslint.config.mjs`

```bash
npm run lint         # Check code
npm run lint:fix     # Auto-fix issues
```

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

### Field Naming
- Use camelCase for field names
- Be descriptive: `publishedAt` not `pub`
- Collections plural in exports, singular in slug

### Access Control
- Define role-based access explicitly
- Never default to `true` for sensitive operations
- Document access rules in code comments

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

## Review Checklist

**For Code Reviews:**
- [ ] Code follows standards
- [ ] Types are correct
- [ ] Error handling present
- [ ] Tests added/updated
- [ ] No console logs
- [ ] No security issues
- [ ] Performance acceptable
- [ ] Documentation updated

## Questions or Clarifications?

Refer to:
- `./MVP-PROJECT-PLAN.md` - Project scope and timeline
- `./system-architecture.md` - System design
- `./codebase-summary.md` - Repository structure
