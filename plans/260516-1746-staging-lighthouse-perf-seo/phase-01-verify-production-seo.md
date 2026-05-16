---
phase: 1
title: "Verify Production SEO Env-Gating"
status: complete
priority: P1
effort: 0.5h
verified_at: 2026-05-16
verified_prod_clean: code_ok_runtime_pre_launch
---

## Verification Results (2026-05-16)

**Production state (https://www.privatetours.se/en):**
- `x-robots-tag: noindex, nofollow` — present
- `/robots.txt` — `Disallow: /`
- `<meta name="robots">` — `noindex, nofollow`
- All `/en`, `/sv` paths 307-redirect to `/en/coming-soon` (host-based, in `next.config.ts:54-78`)
- Canonical: `https://privatetours.se/en/` (apex, not www — host mismatch noted below)

**Code env-gating: CORRECT.** Single source of truth `apps/web/lib/environment.ts:isProductionDeployment()` returns `false` when `IS_STAGING==='true' || VERCEL_ENV!=='production'`. Consumers:
- `apps/web/app/robots.ts:11`
- `apps/web/app/sitemap.ts:34`
- `apps/web/app/(site)/[locale]/layout.tsx:74` (meta robots)
- `apps/web/next.config.ts:104` (X-Robots-Tag header — inline check, same logic)

**Why prod looks blocked:** site is in **pre-launch coming-soon mode by design**. Either `IS_STAGING=true` set on the Vercel Production env, or the current prod is being served from a non-`production` Vercel env. Either way, the gating code itself is correct — flipping the env vars at launch flips everything to indexable.

**Pre-launch flip checklist (when ready to launch):**
1. Remove the 4 coming-soon redirects in `apps/web/next.config.ts:54-78`
2. On Vercel Production env: unset `IS_STAGING` (or set to anything other than `'true'`)
3. Confirm `VERCEL_ENV=production` on prod (Vercel sets automatically for Production)
4. Decide canonical host: currently `NEXT_PUBLIC_SITE_URL=https://privatetours.se` (apex) but traffic is served on `www.privatetours.se`. Either set `NEXT_PUBLIC_SITE_URL=https://www.privatetours.se` OR change apex→www redirect to www→apex. **Mismatch is a real SEO issue** post-launch.
5. Re-run Lighthouse — expect SEO ≥ 0.95.

**No code changes needed for this phase.** Gating logic is sound. The phase serves as documentation for the launch flip.



# Phase 1: Verify Production SEO Env-Gating

## Context
- [Plan overview](plan.md)
- Lighthouse SEO=0.61 on staging is fully explained by two intentional staging audits.
- Staging response headers (verified 2026-05-16):
  - `x-robots-tag: noindex, nofollow`
  - `robots.txt: User-Agent: * / Disallow: /`
  - Canonical: `https://privatetours.se/en/` (production host)
- This phase **verifies production is NOT blocked**. Read-only — no fixes unless something is wrong.

## Why
SEO 0.61 looks alarming but is correct for staging. The real risk is: **does production look the same?** If yes, the live site is invisible to Google. Cheap to verify, expensive to miss.

## Implementation Steps

### Step 1: Curl production headers
```bash
curl -s -I "https://privatetours.se/en" | grep -iE "x-robots-tag|server"
curl -s "https://privatetours.se/robots.txt"
curl -s "https://privatetours.se/en" | grep -oE '<link rel="canonical"[^>]+>'
curl -s "https://privatetours.se/en" | grep -oE '<meta name="robots"[^>]+>'
```

### Step 2: Expected production state
| Check | Expected | Fail action |
|-------|----------|-------------|
| `x-robots-tag` header | absent | Locate middleware/header source, gate by `process.env.VERCEL_ENV === 'production'` |
| `robots.txt` | NOT `Disallow: /` (allow crawl, sitemap link) | Update `apps/web/app/robots.ts` to branch on env |
| `<link rel="canonical">` | `https://privatetours.se/en/` (matches request host) | Fix `NEXT_PUBLIC_SITE_URL` env var on Vercel Production |
| `<meta name="robots">` | `index, follow` (or absent) | Fix `generateRobotsDirectives()` calls — likely `noIndex: false` not passed |

### Step 3: Locate gating code
Search for noindex/x-robots-tag sources:
```
grep -rn "x-robots-tag\|noindex" apps/web/middleware* apps/web/proxy* apps/web/app/robots* apps/web/lib/seo* packages/cms 2>&1
```

Likely locations (verify):
- `apps/web/proxy.ts` or `middleware.ts` — header injection for non-prod
- `apps/web/app/robots.ts` — Next.js robots.txt route
- `apps/web/lib/seo.ts:79-96` — `generateRobotsDirectives()` default `index: true`

### Step 4: If gating logic is wrong, fix
Gating should be:
```ts
const isProduction = process.env.VERCEL_ENV === 'production'
// Apply noindex headers ONLY when NOT isProduction
```

**DO NOT** gate on `NODE_ENV` — Vercel sets `NODE_ENV=production` for both Preview and Production builds. Use `VERCEL_ENV` (`production` | `preview` | `development`).

### Step 5: If everything is correct, just record verification
Add a one-line note to phase frontmatter: `verified_prod_clean: true` and move on.

## Related Code Files
- `apps/web/proxy.ts` or `apps/web/middleware.ts` (whichever exists post-Next-16 migration)
- `apps/web/app/robots.ts`
- `apps/web/lib/seo.ts`
- Vercel env vars: `NEXT_PUBLIC_SITE_URL` (must be `https://privatetours.se` on prod)

## Todo List
- [ ] Curl prod `x-robots-tag` header
- [ ] Curl prod `/robots.txt`
- [ ] Curl prod homepage and extract canonical + meta robots
- [ ] Document findings (pass/fail per check) inline in this file
- [ ] If any check fails: locate source, fix env-gating, redeploy, re-verify
- [ ] If all pass: append `verified_prod_clean: true` to frontmatter

## Success Criteria
- Production response has NO `x-robots-tag` (or only safe values like `max-snippet`).
- Production `/robots.txt` allows crawling.
- Production canonical matches the requested host (`https://privatetours.se/en/`).
- Production `<meta name="robots">` is `index, follow` or absent.

## Risk
- If Vercel Production deploys are currently broken (per old plan note), this phase blocks until they're healthy. Defer to `260514-1506-go-live-readiness-review` if needed.

## Unresolved Questions
- Is `VERCEL_ENV` already used consistently for env-gating, or is some code branching on `NODE_ENV`? Investigation in Step 3 will reveal.
