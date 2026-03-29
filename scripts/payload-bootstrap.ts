/**
 * Bootstrap Payload CMS for standalone scripts
 * Requires scripts/patch-next-env.cjs to be preloaded via --require flag
 *
 * Usage in scripts:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/my-script.ts
 */
export { getPayload } from 'payload'
export { default as payloadConfig } from '../packages/cms/payload.config'
