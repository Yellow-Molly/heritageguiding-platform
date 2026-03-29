/**
 * CJS preload script: patches @next/env default export for Payload compatibility
 * Usage: node --require ./scripts/patch-next-env.cjs ...
 *        or: npx tsx --require ./scripts/patch-next-env.cjs ...
 *
 * Payload 3.x does `import nextEnvImport from '@next/env'` which expects a default export.
 * @next/env (Next.js 16) only has named exports. This preload patches the module cache.
 */
const path = require('path')

// Pre-require @next/env and add default export
try {
  const nextEnv = require('@next/env')
  if (!nextEnv.default) {
    nextEnv.default = nextEnv
  }

  // Also load env vars from apps/web
  const webDir = path.resolve(__dirname, '../apps/web')
  nextEnv.loadEnvConfig(webDir)
} catch (e) {
  console.warn('[patch-next-env] Warning: Could not patch @next/env:', e.message)
}
