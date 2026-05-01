# Bundle Analyzer Baseline — 2026-05-01

Source: `apps/web/.next/analyze/client.html` (excluded from git via root `.gitignore`).

## Top 10 Client Chunks

| Rank | Chunk | Stat KB | Parsed KB | Gzip KB | Notes |
|------|-------|--------:|----------:|--------:|-------|
| 1 | 6515-* | 1422 | 675 | 223 | Payload admin: @payloadcms (438), payload (287), @lexical (178), lexical (130), @dnd-kit (111), jsox (107) |
| 2 | c3d0781a-* | 1402 | 735 | 233 | @payloadcms/ui/dist/exports/client |
| 3 | 1968-* | 838 | 217 | 60 | next/dist runtime |
| 4 | 87c73c54-* | 599 | 195 | 61 | react-dom-client.production |
| 5 | 39a3fe87-* | 597 | 335 | 83 | @payloadcms/ui chunk-WDZJLNNB |
| 6 | framework-* | 561 | 185 | 58 | react-dom (543) + react (18) |
| 7 | main-* | 371 | 129 | 37 | next/dist main |
| 8 | 83f9fcfa-* | 309 | 168 | 52 | (unidentified) |
| 9 | 9226-* | 113 | 30 | 11 | (unidentified) |
| 10 | 3357-* | 101 | 26 | 8 | (unidentified) |

## Per-Route App Page Chunks

| Route | Stat KB | Gzip KB |
|-------|--------:|--------:|
| /[locale]/tours | 94.0 | 9.9 |
| /[locale] (homepage) | 32.6 | 6.3 |
| /[locale]/find-tour | 31.7 | 4.5 |
| /[locale]/contact | 27.9 | 5.4 |
| /[locale]/group-booking | 22.7 | 3.2 |
| /[locale]/guides/[slug] | 18.0 | 2.9 |
| /[locale]/guides | 16.0 | 3.7 |
| /[locale]/about-us | 12.2 | 3.4 |
| /[locale]/tours/[slug] | 6.3 | 0.8 |
| /[locale]/faq | 3.3 | 0.8 |

## Totals
- Total client stat: 7959 KB
- Total client gzip: 1108 KB
- Top-2 chunks (Payload admin) account for 35% of total size — admin-only, not loaded on public site.

## Public-Site Critical Path Estimate
Excluding Payload admin chunks (1, 2, 5), public-route initial JS estimate:
- framework + react-dom + main + next runtime = ~2.4 MB stat / ~220 KB gzip baseline
- Plus per-route 6-94 KB stat
- Plus shared vendors (lucide-react, date-fns, next-intl, etc. — already optimized via `optimizePackageImports`)

## Hypothesis vs Lighthouse Baseline
The TTI of 15-17s seen in Lighthouse is NOT explained by JS size alone (220 KB gzip is normal for a Next.js app). Likely cause: Bokun iframe + Bubblav AI chatbot loading sync on every route. Verify in Phase 3 Branch D.

## Analyzer Reproduction
```bash
cd apps/web
npm run analyze
# outputs apps/web/.next/analyze/{client,edge,nodejs}.html
```
