/**
 * Lighthouse CI configuration for automated performance assertions.
 * Runs against local production build to validate Core Web Vitals.
 *
 * Usage: npx @lhci/cli autorun
 * Requires: npm run build && npm run start (or startServerCommand below)
 */

module.exports = {
  ci: {
    collect: {
      // Start production server automatically
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000/en',           // Homepage
        'http://localhost:3000/en/tours',      // Tour catalog
        'http://localhost:3000/en/tours/gamla-stan-walking', // Tour detail
      ],
      numberOfRuns: 3,
      settings: {
        // Use mobile simulation (Lighthouse default) for realistic CWV testing
        // Desktop can be tested separately if needed
      },
    },
    assert: {
      assertions: {
        // Performance score > 90
        'categories:performance': ['error', { minScore: 0.9 }],
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
      // Store results locally (use 'lhci' server for team dashboards)
      target: 'temporary-public-storage',
    },
  },
}
