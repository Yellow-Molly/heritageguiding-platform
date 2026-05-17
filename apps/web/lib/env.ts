/**
 * Runtime env var validation (Zod).
 *
 * Validates at first import; `instrumentation.ts` forces this to happen at boot
 * so misconfiguration fails fast instead of silently breaking at first request.
 *
 * Enforcement is production-only (Vercel `VERCEL_ENV=production` AND
 * `IS_STAGING!=true`). In dev/test/staging, required-in-prod vars are optional
 * so local setups and previews don't break — but if a value IS present it must
 * still match its format constraints (e.g. URL, email, min length).
 *
 * Add a var here only if missing/wrong values cause silent prod failures.
 * Document defaults in `.env.example`; never default secrets here.
 */
import { z } from 'zod'

const isProd =
  process.env.VERCEL_ENV === 'production' && process.env.IS_STAGING !== 'true'

/** Required string in prod, optional elsewhere. */
const prodRequired = (minLen = 1) =>
  isProd ? z.string().min(minLen) : z.string().min(minLen).optional()

const envSchema = z.object({
  // Always required — without these the app cannot boot meaningfully anywhere.
  DATABASE_URL: z.string().url(),
  PAYLOAD_SECRET: isProd
    ? z.string().min(32, 'must be ≥32 chars in production')
    : z.string().min(1).optional(),

  // Bokun — server-side keys required in prod for availability fetches; widget
  // UUID required in prod for the booking script to load.
  BOKUN_API_KEY: prodRequired(),
  BOKUN_SECRET_KEY: prodRequired(),
  NEXT_PUBLIC_BOKUN_UUID: isProd
    ? z.string().uuid()
    : z.string().uuid().optional(),

  // Bokun webhook — optional even in prod. Webhooks only fire after Bokun
  // commercial onboarding (`260430-1520` phase-01) registers our endpoint
  // and may require the Bokun PLUS plan tier. The webhook handler already
  // 401s when this is unset, so missing config fails closed at request
  // time rather than blocking unrelated pages from booting.
  BOKUN_WEBHOOK_SECRET: z.string().optional(),

  // Public site origin — required in prod for canonical URLs, sitemaps, og:url.
  NEXT_PUBLIC_URL: isProd ? z.string().url() : z.string().url().optional(),

  // Optional services — must be valid IF set.
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  REVALIDATION_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // Sentry — both server and client DSNs supported. NEXT_PUBLIC_SENTRY_DSN
  // is required to capture client-side errors (inlined into the browser
  // bundle). Sentry init is gated by these AND `VERCEL_ENV=production`.
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '<root>'}: ${i.message}`)
    .join('\n')
  // Throw rather than process.exit — Next.js logs the stack and the build
  // (or server boot) terminates with a clear message instead of crashing at
  // first request with an opaque "undefined".
  throw new Error(
    `[env] Invalid environment variables:\n${issues}\n\nSee apps/web/.env.example for required keys.`
  )
}

export const env = parsed.data
