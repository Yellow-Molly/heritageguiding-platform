/**
 * CJS preload script: patches @next/env default export for Payload compatibility
 * Usage: node --require ./scripts/patch-next-env.cjs ...
 *        or: npx tsx --require ./scripts/patch-next-env.cjs ...
 *
 * Payload 3.x does `import nextEnvImport from '@next/env'` and destructures
 * `nextEnvImport.loadEnvConfig`. TSX compiles that ESM import to
 * `import_env.default.loadEnvConfig`. @next/env (Next.js 16) is a CJS module
 * with named exports only — no `.default` — so TSX's generated accessor blows
 * up. This preload sets `.default = <self>` on the module.exports object.
 *
 * Payload bundles its own nested copy of @next/env (node_modules/payload/
 * node_modules/@next/env) in addition to the root-hoisted one; both must be
 * patched because Node's resolver gives Payload's internal files the nested
 * copy, not the hoisted one.
 */
const path = require('path')

// Patch ALL @next/env instances found in node_modules tree.
// Payload bundles its own copy (node_modules/payload/node_modules/@next/env)
// in addition to the root hoisted copy; BOTH must get .default set or
// Payload's internal loadEnv.js will still fail.
function patchNextEnvAt(modulePath) {
  try {
    const nextEnv = require(modulePath)
    if (!nextEnv.default) {
      nextEnv.default = nextEnv
    }
    return true
  } catch {
    return false
  }
}

try {
  // Root-hoisted copy (resolves from scripts/ to project/node_modules/@next/env)
  patchNextEnvAt('@next/env')
  // Payload-nested copy
  patchNextEnvAt(path.resolve(__dirname, '../node_modules/payload/node_modules/@next/env'))

  // Also load env vars from apps/web (use root-hoisted copy for the helper)
  const nextEnv = require('@next/env')
  const webDir = path.resolve(__dirname, '../apps/web')
  nextEnv.loadEnvConfig(webDir)
} catch (e) {
  console.warn('[patch-next-env] Warning: Could not patch @next/env:', e.message)
}
