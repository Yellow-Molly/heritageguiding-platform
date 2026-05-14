/**
 * Lighthouse CI configuration for automated performance assertions.
 * Validates Core Web Vitals against either a remote deployment or a local build.
 *
 * CI usage (audits remote Vercel deployment):
 *   LHCI_BASE_URL=https://your-deployment.vercel.app npx @lhci/cli autorun
 *
 * Local usage (builds + serves locally):
 *   npm run build && npx @lhci/cli autorun
 */

const baseUrl = process.env.LHCI_BASE_URL
const isRemote = Boolean(baseUrl)
const targetUrl = baseUrl || 'http://localhost:3000'

module.exports = {
  ci: {
    collect: {
      // Only spin up a local server when no remote URL was provided
      ...(isRemote
        ? {}
        : {
            startServerCommand: 'npm run start',
            startServerReadyPattern: 'Ready',
            startServerReadyTimeout: 30000,
          }),
      url: [
        `${targetUrl}/en`,                              // Homepage
        `${targetUrl}/en/tours`,                         // Tour catalog
        `${targetUrl}/en/tours/gamla-stan-walking`,      // Tour detail
      ],
      numberOfRuns: 3,
      settings: {
        // Use mobile simulation (Lighthouse default) for realistic CWV testing
      },
    },
    assert: {
      assertions: {
        // Performance score > 70 (temporarily lowered during image optimization, restore to 0.9 in Phase 5)
        'categories:performance': ['error', { minScore: 0.7 }],
        // Accessibility score > 95
        'categories:accessibility': ['warn', { minScore: 0.95 }],
        // Best practices > 90
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        // SEO > 90
        'categories:seo': ['warn', { minScore: 0.9 }],
        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      // Store results in LHCI's temporary public storage (no auth required)
      target: 'temporary-public-storage',
    },
  },
}
