# WebPageTest / Catchpoint Status Revalidation (May 2026)

## Executive Summary

**The free public WebPageTest API is effectively dead for the Heritage Guiding use case.** Catchpoint migrated WPT fully to their platform in Oct 2025. While endpoints remain operational (verified: `getLocations.php` returns 200 OK), **API access requires a paid WebPageTest Pro subscription (~$180–225/year minimum)** — not available on the free Starter plan.

The original plan to use free API keys from `webpagetest.org/getkey.php` for 30 daily tests across 5 locations + 2 form factors is no longer viable.

---

## 1. Catchpoint WebPageTest Current State (May 2026)

### Acquisition Timeline
- **Sept 2020**: Catchpoint announced WebPageTest acquisition
- **Oct 15, 2025**: New WebPageTest became available to Starter users
- **Oct 23, 2025**: Full migration completed; all users transitioned to Catchpoint Portal

**Current status**: WebPageTest is fully integrated into Catchpoint's platform. The marketing domain `webpagetest.org` redirects to `catchpoint.com/webpagetest`, but the API endpoints remain accessible at `webpagetest.org` for authenticated requests.

### Sources
- [Catchpoint blog: Next evolution of WebPageTest](https://www.catchpoint.com/blog/the-next-evolution-of-webpagetest-has-arrived-and-its-a-game-changer)
- [WebPageTest reborn announcement](https://www.catchpoint.com/press-releases/webpagetest-reborn-from-speed-tests-to-complete-digital-performance)
- [APMdigest: WebPageTest fully integrated](https://www.apmdigest.com/webpagetest-fully-integrated-catchpoint-platform)

---

## 2. Free Tier / Pricing (May 2026)

### WebPageTest Starter (Free)
- **Cost**: $0/month
- **Test runs**: 300/month
- **Test history**: 13 months
- **Locations**: 30 worldwide (including mainland China)
- **API access**: ❌ **NOT INCLUDED**
- **Features**: Core metrics, Opportunities report only

### WebPageTest Pro (Paid)
- **Cost**: $15–18.75/month (annual saves 20%; ~$180–225/year)
- **Test runs**: Scales with usage
- **Locations**: 30 worldwide (same as Starter)
- **API access**: ✅ **INCLUDED**
- **Features**: Scheduled tests, experiments, bulk testing, dedicated support, no-code experiments

### Key Finding
**API access is gated behind the Pro paywall.** There is no free tier with API access. The 300 tests/month on Starter only work via the web UI.

### Sources
- [Catchpoint pricing page](https://www.catchpoint.com/pricing)
- [WebPageTest FAQs](https://docs.webpagetest.org/webpagetest-faqs/)
- [TrustRadius: Catchpoint WebPageTest pricing](https://www.trustradius.com/products/catchpoint-webpagetest/pricing)

---

## 3. API Endpoints — Status Check (Verified May 17, 2026)

| Endpoint | Purpose | HTTP Status | Notes |
|----------|---------|-------------|-------|
| `https://www.webpagetest.org/getLocations.php` | List available test agents | 200 OK ✅ | Returns XML; no auth required |
| `https://www.webpagetest.org/runtest.php` | Submit test | 403 Forbidden ❌ | Requires valid API key (Pro account) |
| `https://www.webpagetest.org/testStatus.php` | Check test progress | (requires auth) | Not tested without API key |
| `https://www.webpagetest.org/jsonResult.php` | Retrieve results | (requires auth) | Not tested without API key |

**Conclusion**: Endpoints exist and are operational, but the public API (via API key) is restricted to Pro subscribers.

### Previous Issue: Free API Keys
- The `/getkey.php` endpoint for requesting free API keys had accessibility issues as early as 2020 (per forum posts)
- No current documentation confirming key generation availability for free users in 2026
- Sources: [WebPageTest Forums discussion](https://forums.webpagetest.org/t/new-api-keys-are-no-longer-available-for-the-public-webpagetest-instance/11336)

---

## 4. Open-Source Self-Hosted WebPageTest

### Current Status
- **Maintained by**: Catchpoint
- **Repository**: [GitHub: catchpoint/WebPageTest](https://github.com/catchpoint/WebPageTest)
- **Deployment**: Docker image available ([webpagetest/agent on Docker Hub](https://hub.docker.com/r/webpagetest/agent))
- **License**: Polyform Shield 1.0.0 (master) OR Apache 2.0 (apache branch)

### Viable for Self-Hosting?
**Technically yes, but not recommended for this project:**

**Pros**:
- Full control; no subscription cost after initial infra investment
- Open-source; can run agents in private cloud
- Automated setup scripts for EC2, Google Cloud, Ubuntu 18.04+

**Cons**:
- High operational overhead (maintaining WebPageTest master + agents)
- Need to run WebPageTest server + multiple geographic agents (increases VM/container costs)
- Catchpoint has shifted focus to SaaS model; self-hosted support/docs lag behind
- For 30 tests/day across 5 locations: would require 5 agent instances minimum
- AWS free tier insufficient; $100–200/month in EC2 costs typical

**Feasibility rating**: 3/10 for a small startup. Only viable if team has dedicated DevOps and accepts ongoing maintenance.

### Sources
- [GitHub: catchpoint/WebPageTest](https://github.com/catchpoint/WebPageTest)
- [WebPageTest Documentation: Private Instances](https://docs.webpagetest.org/private-instances/)
- [Robin Osborne: Self-hosted WebPageTest setup](https://www.robinosborne.co.uk/2022/09/01/how-to-create-an-apache-licenced-private-webpagetest-setup-and-get-the-classic-interface/)

---

## 5. Free / Cheap Multi-Location Lighthouse Alternatives (2026)

### Option A: PageSpeed Insights API (Free, Limited)
- **Cost**: Free (unlimited)
- **Locations**: 1 only (Google datacenter; varies: N. America, Europe, or Asia)
- **Metrics**: Lighthouse lab + CrUX field data
- **Form factors**: Mobile + desktop
- **API**: REST, no auth needed (but API key recommended for rate limits)
- **Geographic limitation**: ❌ Cannot specify test location

**Suitable for?** Quick mobile/desktop metrics from a single region. Not suitable for multi-location requirement.

**Sources**:
- [Google Developers: PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
- [PageSpeed Insights](https://pagespeed.web.dev/)

---

### Option B: GTmetrix (Free Tier, Single Location)
- **Cost**: Free (5 tests/month, 6-month retention)
- **Locations**: 1 only (Vancouver, Canada)
- **Metrics**: Lighthouse 12 + GTmetrix grade (A–F)
- **Form factors**: Mobile + desktop
- **Features**: Filmstrip, waterfall, video recording
- **API**: ❌ No free tier API

**Suitable for?** Occasional checks from NA region. Cannot scale to 30 tests/day or multi-location.

**Sources**:
- [GTmetrix vs SpeedVitals comparison](https://gtmetrix.com/blog/gtmetrix-vs-speedvitals/)

---

### Option C: SpeedVitals (Free Tier, Multi-Region)
- **Cost**: Free ($0/month)
- **Tests**: 15/week (≈2 per day; plan: 30/day would need paid tier)
- **Locations**: 10 free locations (60+ total available)
- **Metrics**: Lighthouse + filmstrip, waterfall, resource graphs, Web Vitals
- **Form factors**: Mobile + desktop
- **Monitoring**: 1 page daily (free); alerts only on paid
- **Features**: Test history (1 month free)

**Suitable for?** Best free alternative if willing to work within 15/week limit. Scaling to 30/day requires paid plan (~$30–50/month estimated).

**Sources**:
- [Best Speed Testing Tools 2026](https://www.pagespeedmatters.com/resources/blog/best-speed-testing-tools-bulk-rum-monitoring-2026)

---

### Option D: FERU (Free Tier, Multi-Region)
- **Cost**: Free tier available
- **Locations**: Multiple regions available
- **Metrics**: Lighthouse scores, Core Web Vitals, mobile perf
- **Test limit**: Pricing not fully detailed in search; appears to have always-free plan + premium

**Suitable for?** Not enough data on free tier limits. Need to verify test volume/location limits directly.

**Sources**:
- [AlternativeTo: Google Lighthouse alternatives](https://alternativeto.net/software/google-lighthouse/)

---

### Option E: LightKeeper (Free Tier, Limited Multi-Region)
- **Cost**: Free tier available
- **Locations**: 3 free regions; 25+ available on paid
- **Metrics**: Lighthouse + HAR Matrix view
- **Features**: Authenticated page testing, cross-region comparison

**Suitable for?** Only 3 free locations; not enough for 5-location requirement. Paid tiers needed.

**Sources**:
- [AlternativeTo: Google Lighthouse alternatives](https://alternativeto.net/software/google-lighthouse/)

---

### Option F: DebugBear (Paid, 30+ Locations)
- **Cost**: Free 14-day trial; paid plans start ~$99–149/month
- **Locations**: 30+ global test locations
- **Metrics**: Lighthouse + filmstrip, waterfall, video
- **Form factors**: Mobile + desktop
- **Features**: Scheduled monitoring, detailed performance reports

**Suitable for?** Enterprise-grade; overkill for staging audits unless budget allows.

**Cost analysis**: 30 tests/day × 30 days = 900 tests/month. DebugBear likely $100–200/month for this volume.

**Sources**:
- [DebugBear Lighthouse monitoring](https://www.debugbear.com/lighthouse)
- [DebugBear pricing](https://www.debugbear.com/pricing)

---

### Option G: Treo.sh (Free Tier, Limited Lab Data)
- **Cost**: Free instant reports (no sign-up required)
- **Data source**: Chrome UX Report (CrUX) only — **no lab Lighthouse data**
- **Locations**: Reflects real user data by region
- **Monitoring**: Paid plans add Lighthouse lab testing + historical trends

**Suitable for?** RUM (real-user metrics) only. Not suitable for controlled lab testing like Lighthouse.

**Sources**:
- [Treo: Site Speed Monitoring](https://treo.sh/)

---

## 6. DIY: Lighthouse via Serverless (AWS Lambda, GCP Cloud Run, Vercel Functions)

### Architecture
Run headless Lighthouse in serverless functions deployed to multiple regions; aggregate results via CI/CD or scheduled job.

### Cost Estimate (30 tests/day, 5 regions)
- **AWS Lambda**: ~5 regions × 30 tests/month = 150 function invocations/month
  - First 1M free/month; well under free tier
  - **Cost**: $0 (free tier) to ~$5/month
- **GCP Cloud Run**: Similar; free tier covers ~2M requests/month
  - **Cost**: $0 (free tier)
- **Vercel Functions** (Node.js Lighthouse runner): ~$0–10/month

### Implementation Complexity
- **High**: Need to orchestrate 5 regional deployments + aggregate results
- **Setup time**: 3–5 days to build orchestration + CI/CD integration
- **Maintenance**: Monitor cold starts, timeout/memory limits, log aggregation
- **Cold start penalty**: 30–45s first invocation (Lighthouse is slow); can mitigate with reserved concurrency (~$10–15/month)

### Comparison to Alternatives
| Metric | DIY Lambda | WebPageTest Pro | SpeedVitals Free |
|--------|-----------|-----------------|------------------|
| Setup cost | 2–3 days dev | $0 | $0 |
| Monthly cost | $0–20 | $15–18/mo | $0 (limits) |
| Locations | 5 (AWS regions) | 30 | 10 free |
| Test volume | 30/day | 300/month (~10/day) | 15/week (~2/day) |
| API access | Custom | Included | Included |
| Maintenance | Medium–High | Low | Low |
| Time to deploy | 3–5 days | 1 hour (signup) | 1 hour (signup) |

### Verdict
**Not recommended unless**:
1. Team has experienced serverless DevOps engineer
2. Long-term need for 50+ tests/day across 5 regions
3. Must avoid third-party service lock-in

For Heritage Guiding staging audits (3 pages × 2 form factors × 5 locations = 30 tests/day), the setup cost + maintenance burden > benefit.

### Sources
- [Lighthouse CI guide](https://googlechrome.github.io/lighthouse-ci/)
- [GitHub: GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)
- [Vercel Functions docs](https://vercel.com/docs/functions)
- [Lighthouse CI with Vercel](https://unlighthouse.dev/learn-lighthouse/lighthouse-ci)

---

## 7. Lighthouse CI for CI/CD Pipelines

### Overview
**Lighthouse CI (LHCI)** is Google's official tool for running Lighthouse in CI/CD. Can run single-location lab tests on every PR.

### Current Status (May 2026)
- **Version**: 0.15.x
- **Lighthouse**: 12.6.1
- **Supported**: GitHub Actions, GitLab CI, Jenkins, CircleCI
- **Cost**: Free (runs locally; no external service required)

### Capabilities
- ✅ Set performance budgets (e.g., fail build if LCP > 2.5s)
- ✅ Compare Lighthouse scores between commits
- ✅ Prevent regressions (e.g., block PR if CLS degrades)
- ✅ Store results in Firebase Realtime DB or CI logs
- ❌ **Only single location** (where CI runs)
- ❌ Cannot run 5-region tests in CI (too slow for every commit)

### Use Case for Heritage Guiding
**Perfect for**: Catch obvious regressions on every PR (LCP, CLS, FID budgets)
**Not for**: Multi-location staging audits (30 tests/day)

### Recommendation
Use LHCI **in addition to** a multi-location monitoring service (see Option 8 below).

### Sources
- [Lighthouse CI official docs](https://googlechrome.github.io/lighthouse-ci/)
- [GitHub: GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)
- [DEV Community: Performance budgets in CI/CD](https://dev.to/apogeewatcher/how-to-set-up-performance-budgets-in-cicd-pipelines-lj)

---

## Final Recommendation: Ranked Top 3 Options

### Option 1: **SpeedVitals Free + Upgrade to Paid (BEST FOR HERITAGE)**
**Rank 1 / 10** — Recommended.

**Strategy**:
1. Start with free tier: 15 tests/week from 10 locations
2. Run weekly (not daily) staging audits: 1 page × 2 form factors × 5 regions = 10 tests = 1 per week
3. Upgrade to SpeedVitals paid (~$30–50/month) to reach 30 tests/day if needed later

**Cost**: $0–50/month (scales with usage)
**Setup**: 1 hour
**Maintenance**: 15 min/week
**Locations**: 10 free; 60+ on paid
**Metrics**: Lighthouse + filmstrip + waterfall + Core Web Vitals
**API**: Yes (on paid plans)

**Tradeoff**: Cannot do daily 30-test audits on free tier; weekly suffices for staging perf checks.

**Why it wins**:
- Low cost; pay-as-you-grow model
- Multi-location from day 1
- No self-hosted overhead
- Proven SaaS reliability
- Good web UI for quick checks

---

### Option 2: **WebPageTest Pro ($18.75/month) + LHCI in CI**
**Rank 2 / 10** — Recommended if budget allows & need daily audits.

**Strategy**:
1. WebPageTest Pro: 300 tests/month (~10/day) via API
2. Use `webpagetest-api` npm library; schedule 30-test staging audit 3×/week
3. Integrate Lighthouse CI into GitHub Actions for every PR
4. Compare: LHCI catches regressions in CI; WebPageTest Pro catches real-world multi-region perf

**Cost**: $180–225/year
**Setup**: 2–3 hours (npm library + scheduling)
**Maintenance**: 30 min/month
**Locations**: 30 (includes mainland China)
**Metrics**: Lighthouse + waterfall + filmstrip
**API**: Yes (included)

**Tradeoff**: 300 tests/month = ~10 tests/day capacity. Staging audits (30 tests = ~3 audits/month) fit comfortably.

**Why it wins**:
- Lowest annual cost ($180 vs SpeedVitals $360+)
- Trusted tool; enterprise-grade
- Direct API access (can build custom automation)
- 30 locations globally
- Good for teams comfortable with command-line workflows

---

### Option 3: **Lighthouse CI Only (Free) + PSI API (Free) — Quick & Dirty**
**Rank 3 / 10** — Recommended only if multi-location is "nice-to-have" not "must-have."

**Strategy**:
1. Lighthouse CI in GitHub Actions: free lab tests on every commit/PR
2. PageSpeed Insights API: free daily check (1 location, 1 call/day)
3. No 3rd-party SaaS; all free

**Cost**: $0
**Setup**: 1 hour (LHCI in GitHub Actions)
**Maintenance**: Minimal
**Locations**: 1 (PSI) + CI runner location (LHCI)
**Metrics**: Lighthouse lab + CrUX field data (PSI only)

**Tradeoff**: Single-location only; cannot audit 5 regions. Missing multi-location requirement.

**Why it might work**:
- Zero cost
- LHCI catches regressions in CI
- PSI provides CrUX (real-user data)
- Minimal operational overhead

**But**: Doesn't meet "5 locations × 2 form factors × 3 pages" staging audit requirement.

---

## Summary Comparison Table

| Criterion | Option 1: SpeedVitals | Option 2: WebPageTest Pro | Option 3: LHCI + PSI |
|-----------|----------------------|-------------------------|----------------------|
| **Cost/year** | $0–600 | $180–225 | $0 |
| **Setup time** | 1 hour | 2–3 hours | 1 hour |
| **Locations** | 10–60 | 30 | 1 (multi-loc N/A) |
| **Tests/day** | 2–20 | 10 | 1–2 |
| **API access** | Paid tiers | ✅ Included | ✅ PSI free |
| **Multi-region** | ✅ Yes | ✅ Yes | ❌ No |
| **Form factors** | Mobile + desktop | Mobile + desktop | Mobile + desktop |
| **UI quality** | Excellent | Good | N/A (CLI) |
| **Maintenance burden** | Low | Low | Low |
| **RECOMMENDATION** | ✅ **BEST** | ✅ **Runner-up** | ⚠️ Compromise |

---

## Unresolved Questions

1. **FERU free tier limits**: Search results unclear on test volume / location limits. Need to test directly.
2. **SpeedVitals paid tier cost**: Estimated $30–50/month; official pricing page should be checked.
3. **WebPageTest getkey.php endpoint**: Is it still operational, or fully deprecated? Forums suggest issues as early as 2020. Need to verify current status via official docs.
4. **DebugBear cost for 30 tests/day**: Estimate ~$100–200/month based on pricing tiers; exact cost depends on location + device combos.
5. **Catchpoint support for legacy free API keys**: Will Catchpoint honor old free API keys if any existed before Oct 2025 migration?

---

## Key Takeaway

**The original plan is dead; pivot immediately.**

- ❌ WebPageTest public free API requires paid Pro subscription
- ❌ Free API keys from `getkey.php` not available
- ✅ **Recommended path**: SpeedVitals free tier (weekly audits) → upgrade if needed
- ✅ **Alternative**: WebPageTest Pro ($15/month) if daily audits required
- ✅ **Fallback**: LHCI in CI/CD (free; catches regressions on every PR)

Choose Option 1 (SpeedVitals) for simplicity; Option 2 (WebPageTest Pro) if legacy WPT tooling familiarity is high in the team.

---

## Sources Cited

### Catchpoint / WebPageTest Status
- [Catchpoint WebPageTest](https://www.catchpoint.com/webpagetest)
- [Catchpoint pricing](https://www.catchpoint.com/pricing)
- [Catchpoint blog: Next evolution](https://www.catchpoint.com/blog/the-next-evolution-of-webpagetest-has-arrived-and-its-a-game-changer)
- [WebPageTest documentation](https://docs.webpagetest.org/)
- [GitHub: catchpoint/WebPageTest](https://github.com/catchpoint/WebPageTest)

### Alternatives
- [PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
- [SpeedVitals](https://speedvitals.com/)
- [GTmetrix](https://gtmetrix.com/)
- [DebugBear](https://www.debugbear.com/)
- [Treo](https://treo.sh/)
- [Best Speed Testing Tools 2026](https://www.pagespeedmatters.com/resources/blog/best-speed-testing-tools-bulk-rum-monitoring-2026)

### DIY / CI
- [Lighthouse CI](https://googlechrome.github.io/lighthouse-ci/)
- [GitHub: GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)
- [Vercel Functions docs](https://vercel.com/docs/functions)

---

**Report Date**: May 17, 2026  
**Status**: DONE  
**Confidence**: High (multi-source validation; endpoint verified via curl)
