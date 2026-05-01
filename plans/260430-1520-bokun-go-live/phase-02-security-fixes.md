# Phase 02 — Critical Security Fixes

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P0 — blocks production | not-started | 4–6h |

Five critical findings from `plans/reports/code-reviewer-260201-0120-bokun-integration.md` are deployment blockers. This phase resolves them. Runs in parallel with Phase 01.

## Files In Scope

- `apps/web/app/api/bokun/webhook/route.ts`
- `apps/web/app/api/bokun/availability/route.ts`
- `apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts`
- `apps/web/lib/bokun/index.ts`
- `apps/web/components/bokun-booking-widget-with-fallback.tsx`
- `apps/web/lib/bokun/__tests__/*.test.ts` (extend, don't replace)

**Verify first:** read each file to confirm whether the fix has already shipped — code-reviewer report is from 2026-02-01 and the team may have already addressed some items. Skip any that's already done.

---

## Fix 1 — Timing-Safe Webhook Signature Comparison

**Problem:** `signature === expectedSignature` is vulnerable to timing attacks.

**Fix:** use `crypto.timingSafeEqual` with equal-length buffers.

```typescript
// apps/web/app/api/bokun/webhook/route.ts
import { createHmac, timingSafeEqual } from 'crypto'

function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.BOKUN_WEBHOOK_SECRET
  if (!secret) return false

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  const givenBuf = Buffer.from(signature, 'hex')

  if (expectedBuf.length !== givenBuf.length) return false
  return timingSafeEqual(expectedBuf, givenBuf)
}
```

Add unit test: two signatures of different lengths return false without throwing.

---

## Fix 2 — Webhook Body Size Limit

**Problem:** `request.text()` reads unbounded body. Hostile actor can send gigabytes.

**Fix:** stream + cap at 1MB. Reject early.

```typescript
const MAX_BODY_BYTES = 1_000_000

async function readBoundedBody(request: NextRequest): Promise<string | null> {
  const reader = request.body?.getReader()
  if (!reader) return null

  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BODY_BYTES) {
      reader.cancel()
      return null
    }
    chunks.push(value)
  }

  return new TextDecoder().decode(Buffer.concat(chunks))
}
```

Webhook handler returns 413 when `readBoundedBody` returns null.

---

## Fix 3 — Runtime Credential Validation

**Problem:** `process.env.BOKUN_API_KEY!` non-null assertion silently passes `undefined` if env unset, causing cryptic 500 later. Also `NEXT_PUBLIC_BOKUN_UUID` may be missing in client.

**Fix server-side** (`bokun-api-client-with-hmac-authentication.ts`):

```typescript
constructor() {
  const accessKey = process.env.BOKUN_API_KEY
  const secretKey = process.env.BOKUN_SECRET_KEY
  if (!accessKey || !secretKey) {
    throw new Error('Bokun API credentials missing: set BOKUN_API_KEY and BOKUN_SECRET_KEY')
  }
  this.accessKey = accessKey
  this.secretKey = secretKey
  this.baseUrl = process.env.NODE_ENV === 'production' ? BOKUN_PROD_URL : BOKUN_TEST_URL
}
```

**Fix client-side** (`bokun-booking-widget-with-fallback.tsx`): already shows error UI when UUID missing. Verify it never logs the UUID itself (low risk — UUID is public).

---

## Fix 4 — Strict Date Validation

**Problem:** availability route regex-checks format but doesn't catch invalid dates like `2026-13-99` or end-before-start.

**Fix** (`apps/web/app/api/bokun/availability/route.ts`):

```typescript
function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(s + 'T00:00:00Z')
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

const MAX_RANGE_DAYS = 365

// inside handler, after extracting params:
if (!isValidISODate(startDate) || !isValidISODate(endDate)) {
  return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
}
const start = new Date(startDate + 'T00:00:00Z')
const end = new Date(endDate + 'T00:00:00Z')
if (end < start) return NextResponse.json({ error: 'endDate before startDate' }, { status: 400 })
const days = (end.getTime() - start.getTime()) / 86_400_000
if (days > MAX_RANGE_DAYS) return NextResponse.json({ error: 'Range too wide' }, { status: 400 })
```

Also: validate `experienceId` is alphanumeric/dash only — block injection-style values:

```typescript
if (!/^[A-Za-z0-9\-_]{1,64}$/.test(experienceId)) {
  return NextResponse.json({ error: 'Invalid experienceId' }, { status: 400 })
}
```

---

## Fix 5 — Remove Singleton Race / Module-Level Side Effects

**Problem:** `export const bokunClient = new BokunApiClient()` runs at module-load time. Throws during build if env not set; multiple Next.js workers may instantiate concurrently with stale env.

**Fix:** lazy factory.

```typescript
// bokun-api-client-with-hmac-authentication.ts
let _client: BokunApiClient | null = null

export function getBokunClient(): BokunApiClient {
  if (!_client) _client = new BokunApiClient()
  return _client
}

// remove: export const bokunClient = new BokunApiClient()
```

Update callers in `bokun-availability-service-with-caching.ts` and `bokun-booking-service-and-widget-url-generator.ts` to call `getBokunClient()` inside functions, not at module top level.

---

## Bonus (cheap, do them now)

These are from the report's "Important Issues 6–10" and take minutes:

- **6.** experienceId regex validation (already covered in Fix 4)
- **7.** Constructor throws on missing creds (covered in Fix 3)
- **8.** Webhook returns **500** on processing errors (lets Bokun retry):
  ```typescript
  return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  ```
  Already correct in current code per plan line 628 — verify in actual file.
- **9.** Webhook origin: skip IP allowlist (Bokun changes infra), rely on signature
- **10.** Cache invalidation: revalidate by tag in webhook handler:
  ```typescript
  import { revalidateTag } from 'next/cache'
  // inside handleBookingCreated/Confirmed/Cancelled:
  revalidateTag('bokun-availability')
  ```

---

## Tests

Extend existing tests in `apps/web/lib/bokun/__tests__/` and add a webhook test file:

- `bokun-api-client-with-hmac-authentication.test.ts`: verify constructor throws when env missing
- `bokun-availability-service-with-caching.test.ts`: invalid date strings, range too wide, bad experienceId
- New `webhook.test.ts`: timing-safe equality, body size cap, signature mismatch returns 401, oversized body returns 413

Run: `npm test --workspace apps/web -- bokun`

---

## Todo

- [ ] Read current state of 5 files, mark which fixes already shipped
- [ ] Fix 1 — timing-safe equals + test
- [ ] Fix 2 — bounded body reader + test (413 path)
- [ ] Fix 3 — credential runtime check + test
- [ ] Fix 4 — date + experienceId validation + test
- [ ] Fix 5 — lazy client factory, update all callers
- [ ] Bonus — cache invalidation in webhook
- [ ] Run `npm run typecheck` and `npm test --workspace apps/web` — clean
- [ ] Mark security review findings closed in code-reviewer report (append note)

## Success Criteria

- All 5 critical findings resolved with passing tests
- Build clean, types clean, lint clean
- No env vars logged anywhere
- Webhook rejects oversized + malformed payloads with correct status codes

## Risks

| Risk | Mitigation |
|------|------------|
| Lazy client breaks existing tests | Update test mocks to use factory |
| Removing module-side-effect breaks import tree | Re-run full test suite after Fix 5 |
| Body-stream code differs across Node/Edge runtime | Force `runtime = 'nodejs'` in route segment config |

## Unresolved Questions

- Confirm webhook signature is **hex** vs **base64** — Bokun docs are inconsistent; test against real test webhook in Phase 03
